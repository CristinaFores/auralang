import type { ExtensionMessage, StartCapturePayload } from '../types'

const OFFSCREEN_URL = chrome.runtime.getURL('src/offscreen/index.html')
const CAPTURE_STATE_KEY = 'auralang_capture_active'

let captureActive = false
let capturedTabId: number | null = null

// Open the side panel on icon click instead of a popup — the popup closes on
// any focus loss (clicking the video, switching tabs), which made it useless
// for watching live captions while actually watching the tab. The side panel
// stays open until the user closes it.
void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

// Create offscreen document immediately so Whisper model starts loading
chrome.runtime.onInstalled.addListener((details) => {
  void ensureOffscreenDocument()
  if (details.reason === 'install') {
    void chrome.tabs.create({ url: chrome.runtime.getURL('src/welcome/index.html') })
  }
})
chrome.runtime.onStartup.addListener(() => void ensureOffscreenDocument())

async function setCaptureActive(active: boolean): Promise<void> {
  captureActive = active
  await chrome.storage.session.set({ [CAPTURE_STATE_KEY]: active })
}

async function getCaptureActive(): Promise<boolean> {
  if (captureActive) return true
  const stored = await chrome.storage.session.get(CAPTURE_STATE_KEY)
  captureActive = stored[CAPTURE_STATE_KEY] === true
  return captureActive
}

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
  await setCaptureActive(true)
}

async function stopCapture(): Promise<void> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  })
  if (contexts.length > 0) {
    // Keep offscreen alive so the model stays in memory
    await chrome.runtime.sendMessage<ExtensionMessage>({ type: 'END_STREAM' })
  }
  capturedTabId = null
  await setCaptureActive(false)
}

// Backup for the offscreen "stream ended" signal: if the captured tab is closed
// outright, make sure our own state doesn't stay stuck on "active".
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === capturedTabId) void stopCapture()
})

function requestMediaStreamId(tabId: number): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
      if (chrome.runtime.lastError || !streamId) {
        reject(new Error(chrome.runtime.lastError?.message ?? 'No stream ID'))
        return
      }
      resolve(streamId)
    })
  })
}

async function beginCaptureForTab(
  tabId: number,
  targetLanguage: string,
  sourceLanguage: string,
  isRetry = false,
): Promise<void> {
  try {
    const streamId = await requestMediaStreamId(tabId)
    capturedTabId = tabId
    await startCapture({ streamId, targetLanguage, sourceLanguage })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    // Stale session from a tab that closed without a clean STOP_CAPTURE — clear
    // our own state and retry once before giving up.
    if (!isRetry && msg.includes('active stream')) {
      await stopCapture()
      await beginCaptureForTab(tabId, targetLanguage, sourceLanguage, true)
      return
    }
    throw err
  }
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'START_CAPTURE') {
      const targetLanguage = (message.payload as { targetLanguage?: string })?.targetLanguage ?? 'es'
      const sourceLanguage = (message.payload as { sourceLanguage?: string })?.sourceLanguage ?? 'en'

      // targetTabId = tab to capture; omit consumerTabId so offscreen can redeem the streamId (Chrome 116+)
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id
        if (!tabId) {
          sendResponse({ success: false, error: 'No active tab found' })
          return
        }
        beginCaptureForTab(tabId, targetLanguage, sourceLanguage)
          .then(() => sendResponse({ success: true }))
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Unknown error'
            sendResponse({ success: false, error: msg })
          })
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

    if (message.type === 'CAPTURE_ENDED') {
      void stopCapture()
      return false
    }

    if (message.type === 'GET_CAPTURE_STATE') {
      void getCaptureActive().then((active) => sendResponse({ active }))
      return true
    }
  },
)
