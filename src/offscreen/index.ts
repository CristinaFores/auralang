import { startAudioCapture, stopAudioCapture } from './audioCapture'
import { processAudioChunk, resetPipelineState } from './pipeline'
import { getTranscriber } from '../services/transcriptionService'
import type { ExtensionMessage, StartCapturePayload } from '../types'

let modelReady = false

getTranscriber()
  .then(() => {
    modelReady = true
    void chrome.runtime.sendMessage<ExtensionMessage>({ type: 'MODEL_READY' })
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : 'Model load failed'
    console.error('[AuraLang] Model load failed:', message)
    void chrome.runtime.sendMessage<ExtensionMessage>({
      type: 'ERROR',
      payload: { message },
    })
  })

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'BEGIN_STREAM') {
      const { streamId, targetLanguage, sourceLanguage } = message.payload as StartCapturePayload

      startAudioCapture(streamId, {
        onChunk: (samples) => {
          processAudioChunk(samples, targetLanguage, sourceLanguage).catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Pipeline error'
            console.error('[AuraLang] Pipeline error:', msg)
            void chrome.runtime.sendMessage<ExtensionMessage>({
              type: 'ERROR',
              payload: { message: msg },
            })
          })
        },
        onError: (msg) => {
          console.error('[AuraLang] Capture error:', msg)
          void chrome.runtime.sendMessage<ExtensionMessage>({
            type: 'ERROR',
            payload: { message: msg },
          })
        },
        onEnded: () => {
          resetPipelineState()
          void chrome.runtime.sendMessage<ExtensionMessage>({ type: 'CAPTURE_ENDED' })
        },
      })
        .then(() => {
          sendResponse({ success: true })
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Capture failed'
          console.error('[AuraLang] startAudioCapture failed:', msg)
          sendResponse({ success: false, error: msg })
        })

      return true
    }

    if (message.type === 'MODEL_READY') {
      sendResponse({ ready: modelReady })
      return false
    }

    if (message.type === 'END_STREAM') {
      stopAudioCapture()
      resetPipelineState()
      sendResponse({ success: true })
    }
  },
)
