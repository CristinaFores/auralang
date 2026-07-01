import { useState, useEffect, useCallback } from 'react'
import type { UserConfig } from '../../types'

const STORAGE_KEY = 'auralang_config'

const DEFAULT_CONFIG: UserConfig = {
  targetLanguage: 'es',
}

interface UseUserConfigReturn {
  config: UserConfig
  isSaving: boolean
  isSaved: boolean
  error: string | null
  updateField: <K extends keyof UserConfig>(key: K, value: UserConfig[K]) => void
  save: () => Promise<void>
}

export function useApiConfig(): UseUserConfigReturn {
  const [config, setConfig] = useState<UserConfig>(DEFAULT_CONFIG)
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
        setConfig(result[STORAGE_KEY] as UserConfig)
      }
    })
  }, [])

  const updateField = useCallback(
    <K extends keyof UserConfig>(key: K, value: UserConfig[K]) => {
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
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
          else resolve()
        })
      })
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }, [config])

  return { config, isSaving, isSaved, error, updateField, save }
}
