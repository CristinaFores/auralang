import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import type { MessageKey } from './useI18n'

interface UseErrorToastsOptions {
  translationError: string | null
  saveError: string | null
  t: (key: MessageKey) => string
}

export function useErrorToasts({ translationError, saveError, t }: UseErrorToastsOptions) {
  const lastTranslationError = useRef<string | null>(null)
  const lastSaveError = useRef<string | null>(null)

  useEffect(() => {
    if (!translationError) {
      lastTranslationError.current = null
      return
    }
    if (translationError === lastTranslationError.current) return

    lastTranslationError.current = translationError
    toast.error(translationError === 'captureEnded' ? t('captureEnded') : translationError, {
      id: `translation:${translationError}`,
    })
  }, [translationError, t])

  useEffect(() => {
    if (!saveError || translationError) {
      lastSaveError.current = null
      return
    }
    if (saveError === lastSaveError.current) return

    lastSaveError.current = saveError
    toast.error(t('saveError'), { id: 'save-error' })
  }, [saveError, translationError, t])
}
