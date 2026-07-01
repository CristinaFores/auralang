import { useMemo } from 'react'
import type { UiLanguage } from '../../types'
import { t as translate } from '../i18n'
import type en from '../i18n/locales/en.json'

export type MessageKey = keyof typeof en

export function useI18n(language: UiLanguage) {
  const t = useMemo(
    () => (key: MessageKey) => translate(key, language),
    [language],
  )

  return { t, language }
}
