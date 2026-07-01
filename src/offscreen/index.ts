import { startAudioCapture, stopAudioCapture } from './audioCapture'
import { processAudioChunk } from './pipeline'
import { getTranscriber } from '../services/transcriptionService'
import type { ExtensionMessage, StartCapturePayload } from '../types'

// Warm up the model as soon as the offscreen document loads
getTranscriber()
  .then(() => {
    void chrome.runtime.sendMessage<ExtensionMessage>({ type: 'MODEL_READY' })
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : 'Model load failed'
    void chrome.runtime.sendMessage<ExtensionMessage>({
      type: 'ERROR',
      payload: { message },
    })
  })

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'BEGIN_STREAM') {
      const { streamId, targetLanguage } = message.payload as StartCapturePayload

      startAudioCapture(streamId, {
        onChunk: (blob) => {
          processAudioChunk(blob, targetLanguage).catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Pipeline error'
            void chrome.runtime.sendMessage<ExtensionMessage>({
              type: 'ERROR',
              payload: { message: msg },
            })
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

    if (message.type === 'END_STREAM') {
      stopAudioCapture()
      sendResponse({ success: true })
    }
  },
)
