import { startAudioCapture, stopAudioCapture } from './audioCapture'
import { processAudioChunk, resetPipelineState } from './pipeline'
import { setModelTier, onModelStatus } from '../asr/modelManager'
import { tierForMode } from '../asr/registry'
import { enqueueChunk, clearQueue } from '../asr/inferenceQueue'
import type { ExtensionMessage, StartCapturePayload } from '../types'

let modelReady = false

onModelStatus((status) => {
  modelReady = status.phase === 'ready'
  if (status.phase === 'ready') {
    // Kept alongside MODEL_STATUS so the popup's existing readiness check
    // works during the migration.
    void chrome.runtime.sendMessage<ExtensionMessage>({ type: 'MODEL_READY' })
  }
  void chrome.runtime.sendMessage<ExtensionMessage>({ type: 'MODEL_STATUS', payload: status })
})

// The model tier is not loaded eagerly: this document can't read chrome.storage
// (see modelManager), so the popup tells us which mode to load via SET_ASR_MODE.

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'BEGIN_STREAM') {
      const { streamId, targetLanguage, sourceLanguage, asrMode } = message.payload as StartCapturePayload

      // Guarantee the selected tier is (loading) before capture, in case the
      // popup's preload SET_ASR_MODE never reached us. No-op if already loaded.
      setModelTier(tierForMode(asrMode))

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
