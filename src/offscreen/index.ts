import { startAudioCapture, stopAudioCapture } from './audioCapture'
import { processAudioChunk } from './pipeline'
import { getTranscriber } from '../services/transcriptionService'
import type { ExtensionMessage, StartCapturePayload } from '../types'

let modelReady = false

console.log('[AuraLang] Offscreen document started — loading Whisper model...')

getTranscriber()
  .then(() => {
    modelReady = true
    console.log('[AuraLang] Whisper model ready ✓')
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
      const { streamId, targetLanguage } = message.payload as StartCapturePayload
      console.log('[AuraLang] BEGIN_STREAM received — streamId:', streamId, 'lang:', targetLanguage)

      startAudioCapture(streamId, {
        onChunk: (samples) => {
          console.log('[AuraLang] Audio chunk received, samples:', samples.length)
          processAudioChunk(samples, targetLanguage).catch((err: unknown) => {
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
      })
        .then(() => {
          console.log('[AuraLang] Audio capture started ✓')
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
      console.log('[AuraLang] END_STREAM — stopping capture')
      stopAudioCapture()
      sendResponse({ success: true })
    }
  },
)
