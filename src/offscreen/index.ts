import { startAudioCapture, stopAudioCapture } from './audioCapture'
import { processAudioChunk } from './pipeline'
import type { ExtensionMessage, StartCapturePayload, ApiConfig } from '../types'

const STORAGE_KEY = 'auralang_config'

async function loadConfig(): Promise<ApiConfig | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      resolve((result[STORAGE_KEY] as ApiConfig) ?? null)
    })
  })
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'START_CAPTURE') {
      const { streamId } = message.payload as StartCapturePayload

      loadConfig()
        .then((config) => {
          if (!config?.openaiKey) throw new Error('API key not configured')

          return startAudioCapture(streamId, {
            onChunk: (blob) => {
              processAudioChunk(blob, config).catch((err: unknown) => {
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
