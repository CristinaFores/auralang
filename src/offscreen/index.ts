import { startAudioCapture, stopAudioCapture } from './audioCapture'
import { processAudioChunk, resetPipelineState } from './pipeline'
import { getTranscriber, onModelStatus } from '../asr/modelManager'
import { enqueueChunk, clearQueue } from '../asr/inferenceQueue'
import type { ExtensionMessage, StartCapturePayload } from '../types'

let modelReady = false

onModelStatus((status) => {
  if (status.phase === 'ready') {
    modelReady = true
    // Kept alongside MODEL_STATUS so the popup's existing readiness check
    // works during the migration.
    void chrome.runtime.sendMessage<ExtensionMessage>({ type: 'MODEL_READY' })
  }
  void chrome.runtime.sendMessage<ExtensionMessage>({ type: 'MODEL_STATUS', payload: status })
})

getTranscriber().catch((err: unknown) => {
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
          enqueueChunk(samples, async (chunk) => {
            try {
              await processAudioChunk(chunk, targetLanguage, sourceLanguage, (update) => {
                void chrome.runtime.sendMessage<ExtensionMessage>({
                  type: 'TRANSCRIPT_UPDATE',
                  payload: update,
                })
              })
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Pipeline error'
              console.error('[AuraLang] Pipeline error:', msg)
              void chrome.runtime.sendMessage<ExtensionMessage>({
                type: 'ERROR',
                payload: { message: msg },
              })
            }
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
          clearQueue()
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
      clearQueue()
      resetPipelineState()
      sendResponse({ success: true })
    }
  },
)
