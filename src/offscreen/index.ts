import { startAudioCapture, stopAudioCapture } from './audioCapture'
import type { ExtensionMessage, StartCapturePayload } from '../types'

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'START_CAPTURE') {
      const { streamId } = message.payload as StartCapturePayload

      startAudioCapture(streamId, {
        onChunk: (blob) => {
          // Relay chunk to background for Phase 4 AI pipeline
          void chrome.runtime.sendMessage<ExtensionMessage>({
            type: 'AUDIO_CHUNK',
            payload: blob,
          })
        },
        onError: (msg) => {
          void chrome.runtime.sendMessage<ExtensionMessage>({
            type: 'ERROR',
            payload: { message: msg },
          })
        },
      })
        .then(() => sendResponse({ success: true }))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Capture failed'
          sendResponse({ success: false, error: msg })
        })

      return true
    }

    if (message.type === 'STOP_CAPTURE') {
      stopAudioCapture()
      sendResponse({ success: true })
    }
  },
)
