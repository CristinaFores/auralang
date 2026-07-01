import { useState, useEffect, useCallback } from 'react'
import type { ApiConfig } from '../../types'

const STORAGE_KEY = 'auralang_config'

const DEFAULT_CONFIG: ApiConfig = {
  openaiKey: '',
  whisperModel: 'whisper-1',
  targetLanguage: 'es',
}

interface UseApiConfigReturn {
  config: ApiConfig
  isSaving: boolean
  isSaved: boolean
  error: string | null
  updateField: <K extends keyof ApiConfig>(key: K, value: ApiConfig[K]) => void
  save: () => Promise<void>
}

export function useApiConfig(): UseApiConfigReturn {
  const [config, setConfig] = useState<ApiConfig>(DEFAULT_CONFIG)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (chrome.runtime.lastError) {
        setError(chrome.runtime.lastError.message ?? 'Failed to load config')
        return
      }
      if (result[STORAGE_KEY]) {
        setConfig(result[STORAGE_KEY] as ApiConfig)
      }
    })
  }, [])

  const updateField = useCallback(
    <K extends keyof ApiConfig>(key: K, value: ApiConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }))
      setIsSaved(false)
    },
    [],
  )

  const save = useCallback(async () => {
    setIsSaving(true)
    setError(null)

    try {
      await new Promise<void>((resolve, reject) => {
        chrome.storage.local.set({ [STORAGE_KEY]: config }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve()
          }
        })
      })
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save config')
    } finally {
      setIsSaving(false)
    }
  }, [config])

  return { config, isSaving, isSaved, error, updateField, save }
}
