import { useState, useEffect, useCallback, useRef } from 'react'
import type { UserConfig } from '../../types'
import { detectBrowserLocale } from '../i18n'

const STORAGE_KEY = 'auralang_config'

const DEFAULT_CONFIG: UserConfig = {
  targetLanguage: 'es',
  sourceLanguage: 'en',
  uiLanguage: detectBrowserLocale(),
  uiTheme: 'dark',
}

interface UseUserConfigReturn {
  config: UserConfig
  isLoaded: boolean
  error: string | null
  updateField: <K extends keyof UserConfig>(key: K, value: UserConfig[K]) => void
}

export function useApiConfig(): UseUserConfigReturn {
  const [config, setConfig] = useState<UserConfig>(DEFAULT_CONFIG)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isInitialLoad = useRef(true)

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (chrome.runtime.lastError) {
        setError(chrome.runtime.lastError.message ?? 'Failed to load config')
        setIsLoaded(true)
        return
      }
      if (result[STORAGE_KEY]) {
        const stored = result[STORAGE_KEY] as Partial<UserConfig>
        setConfig((prev) => ({
          ...prev,
          ...stored,
          uiLanguage: stored.uiLanguage ?? prev.uiLanguage,
          uiTheme: stored.uiTheme ?? prev.uiTheme,
        }))
      }
      setIsLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!isLoaded || isInitialLoad.current) {
      if (isLoaded) isInitialLoad.current = false
      return
    }

    const timer = setTimeout(() => {
      chrome.storage.local.set({ [STORAGE_KEY]: config }, () => {
        if (chrome.runtime.lastError) {
          setError(chrome.runtime.lastError.message ?? 'Failed to save config')
        } else {
          setError(null)
        }
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [config, isLoaded])

  const updateField = useCallback(
    <K extends keyof UserConfig>(key: K, value: UserConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  return { config, isLoaded, error, updateField }
}
