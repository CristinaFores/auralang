import { useState, useCallback, useEffect } from 'react'
import type { TranslationState, ExtensionMessage } from '../../types'

export interface UseTranslationReturn {
  state: TranslationState
  toggle: () => void
}

export function useTranslation(): UseTranslationReturn {
  const [state, setState] = useState<TranslationState>({
    isActive: false,
    isLoading: false,
    isModelReady: false,
    error: null,
  })

  // Listen for MODEL_READY signal from offscreen document
  useEffect(() => {
    const handler = (message: ExtensionMessage) => {
      if (message.type === 'MODEL_READY') {
        setState((prev) => ({ ...prev, isModelReady: true }))
      }
      if (message.type === 'ERROR') {
        const payload = message.payload as { message: string }
        setState((prev) => ({ ...prev, error: payload.message }))
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    const type: ExtensionMessage['type'] = state.isActive ? 'STOP_CAPTURE' : 'START_CAPTURE'

    chrome.runtime.sendMessage<ExtensionMessage>(
      { type },
      (response: { success: boolean; error?: string }) => {
        if (chrome.runtime.lastError || !response?.success) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: chrome.runtime.lastError?.message ?? response?.error ?? 'Unknown error',
          }))
          return
        }
        setState((prev) => ({
          ...prev,
          isActive: !prev.isActive,
          isLoading: false,
        }))
      },
    )
  }, [state.isActive])

  return { state, toggle }
}
