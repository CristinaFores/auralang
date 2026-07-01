import { useState, useCallback } from 'react'
import type { TranslationState, ExtensionMessage } from '../../types'

export interface UseTranslationReturn {
  state: TranslationState
  toggle: () => void
}

export function useTranslation(): UseTranslationReturn {
  const [state, setState] = useState<TranslationState>({
    isActive: false,
    isLoading: false,
    error: null,
  })

  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    const type: ExtensionMessage['type'] = state.isActive ? 'STOP_CAPTURE' : 'START_CAPTURE'

    chrome.runtime.sendMessage<ExtensionMessage>({ type }, (response: { success: boolean; error?: string }) => {
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
    })
  }, [state.isActive])

  return { state, toggle }
}
