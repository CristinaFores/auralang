import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import type { MessageKey } from './useI18n'

interface UseErrorToastsOptions {
  translationError: string | null
  saveError: string | null
  t: (key: MessageKey) => string
}

function friendlyMessage(error: string, t: (key: MessageKey) => string): string {
  if (error === 'captureEnded') return t('captureEnded')
  // Raw chrome.tabCapture error: activeTab not granted on this tab, or a
  // chrome:// / Web Store page, which can never be captured.
  if (error.includes('has not been invoked') || error.includes('cannot be captured')) {
    return t('captureNotAllowed')
  }
  return error
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
    toast.error(friendlyMessage(translationError, t), {
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
