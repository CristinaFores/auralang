import type { ExtensionMessage, StartCapturePayload } from '../types'

const OFFSCREEN_URL = chrome.runtime.getURL('src/offscreen/index.html')

// Create offscreen document immediately so Whisper model starts loading
chrome.runtime.onInstalled.addListener(() => void ensureOffscreenDocument())
chrome.runtime.onStartup.addListener(() => void ensureOffscreenDocument())

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
    type: 'BEGIN_STREAM',
    payload,
  })
}

async function stopCapture(): Promise<void> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  })
  if (contexts.length > 0) {
    // Keep offscreen alive so the model stays in memory
    await chrome.runtime.sendMessage<ExtensionMessage>({ type: 'END_STREAM' })
  }
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'START_CAPTURE') {
      // consumerTabId must be the offscreen document's tab — omitting it uses the calling context
      const targetLanguage = (message.payload as { targetLanguage?: string })?.targetLanguage ?? 'es'

      // tabCapture.getMediaStreamId must be called from the action handler context
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id
        if (!tabId) {
          sendResponse({ success: false, error: 'No active tab found' })
          return
        }
        chrome.tabCapture.getMediaStreamId(
          { consumerTabId: tabId, targetTabId: tabId },
          (streamId) => {
            if (chrome.runtime.lastError || !streamId) {
              sendResponse({ success: false, error: chrome.runtime.lastError?.message ?? 'No stream ID' })
              return
            }
            startCapture({ streamId, targetLanguage })
              .then(() => sendResponse({ success: true }))
              .catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : 'Unknown error'
                sendResponse({ success: false, error: msg })
              })
          },
        )
      })
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
