import { useState, useCallback, useEffect } from 'react'
import type { TranslationState, ExtensionMessage, UserConfig, TranscriptUpdatePayload } from '../../types'

export interface UseTranslationReturn {
  state: TranslationState
  toggle: () => void
}

export function useTranslation(config: Pick<UserConfig, 'targetLanguage' | 'sourceLanguage'>): UseTranslationReturn {
  const [state, setState] = useState<TranslationState>({
    isActive: false,
    isLoading: false,
    isModelReady: false,
    error: null,
    transcript: null,
  })

  useEffect(() => {
    chrome.runtime.sendMessage<ExtensionMessage>(
      { type: 'GET_CAPTURE_STATE' },
      (response: { active?: boolean } | undefined) => {
        if (chrome.runtime.lastError) return
        if (response?.active) {
          setState((prev) => ({ ...prev, isActive: true }))
        }
      },
    )

    // Check if model is already ready (popup opened after model loaded)
    chrome.runtime.sendMessage<ExtensionMessage>(
      { type: 'MODEL_READY' },
      (response: { ready: boolean } | undefined) => {
        if (chrome.runtime.lastError) return // offscreen not up yet
        if (response?.ready) {
          setState((prev) => ({ ...prev, isModelReady: true }))
        }
      },
    )

    // Also listen for the event in case model loads after popup opens
    const handler = (message: ExtensionMessage) => {
      if (message.type === 'MODEL_READY') {
        setState((prev) => ({ ...prev, isModelReady: true }))
      }
      if (message.type === 'ERROR') {
        const payload = message.payload as { message: string }
        setState((prev) => ({ ...prev, error: payload.message }))
      }
      if (message.type === 'CAPTURE_ENDED') {
        setState((prev) => ({
          ...prev,
          isActive: false,
          isLoading: false,
          error: 'captureEnded',
        }))
      }
      if (message.type === 'TRANSCRIPT_UPDATE') {
        const payload = message.payload as TranscriptUpdatePayload
        setState((prev) => ({ ...prev, transcript: payload }))
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null, transcript: null }))

    const type: ExtensionMessage['type'] = state.isActive ? 'STOP_CAPTURE' : 'START_CAPTURE'

    chrome.runtime.sendMessage<ExtensionMessage>(
      {
        type,
        payload: state.isActive
          ? undefined
          : {
              targetLanguage: config.targetLanguage,
              sourceLanguage: config.sourceLanguage,
            },
      },
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
  }, [state.isActive, config.targetLanguage, config.sourceLanguage])

  return { state, toggle }
}
