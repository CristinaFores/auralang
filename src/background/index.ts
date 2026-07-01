import type { ExtensionMessage, StartCapturePayload } from '../types'

const OFFSCREEN_URL = chrome.runtime.getURL('src/offscreen/index.html')

async function ensureOffscreenDocument(): Promise<void> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  })
  if (contexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: [chrome.offscreen.Reason.USER_MEDIA],
      justification: 'Capture and process tab audio stream for real-time translation',
    })
  }
}

async function startCapture(payload: StartCapturePayload): Promise<void> {
  await ensureOffscreenDocument()
  await chrome.runtime.sendMessage<ExtensionMessage>({
    type: 'START_CAPTURE',
    payload,
  })
}

async function stopCapture(): Promise<void> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  })
  if (contexts.length > 0) {
    await chrome.runtime.sendMessage<ExtensionMessage>({ type: 'STOP_CAPTURE' })
    await chrome.offscreen.closeDocument()
  }
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'START_CAPTURE') {
      // consumerTabId must be the offscreen document's tab — omitting it uses the calling context
      chrome.tabCapture.getMediaStreamId(
        {},
        (streamId) => {
          if (chrome.runtime.lastError || !streamId) {
            sendResponse({ success: false, error: chrome.runtime.lastError?.message })
            return
          }
          startCapture({
            streamId,
            targetLanguage: (message.payload as { targetLanguage?: string })?.targetLanguage ?? 'es',
          })
            .then(() => sendResponse({ success: true }))
            .catch((err: unknown) => {
              const msg = err instanceof Error ? err.message : 'Unknown error'
              sendResponse({ success: false, error: msg })
            })
        },
      )
      return true
    }

    if (message.type === 'STOP_CAPTURE') {
      stopCapture()
        .then(() => sendResponse({ success: true }))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          sendResponse({ success: false, error: msg })
        })
      return true
    }
  },
)
