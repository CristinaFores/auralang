import type { UiLanguage, UiTheme } from '../../types'
import { CloseIcon } from './Icons'
import { SegmentedControl } from './SegmentedControl'
import type { MessageKey } from '../hooks/useI18n'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  uiLanguage: UiLanguage
  uiTheme: UiTheme
  onLanguageChange: (lang: UiLanguage) => void
  onThemeChange: (theme: UiTheme) => void
  t: (key: MessageKey) => string
}

export function SettingsPanel({
  isOpen,
  onClose,
  uiLanguage,
  uiTheme,
  onLanguageChange,
  onThemeChange,
  t,
}: SettingsPanelProps) {
  if (!isOpen) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 bg-black/50 z-10"
        onClick={onClose}
        aria-label="Close settings"
      />
      <div className="absolute top-14 right-0 z-20 w-full max-w-[248px] rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] shadow-[0_12px_32px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)] p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-body font-semibold text-[var(--text-primary)]">{t('settings.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-caption font-medium text-muted">{t('settings.uiLanguage')}</span>
          <SegmentedControl
            value={uiLanguage}
            onChange={onLanguageChange}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Español' },
            ]}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-caption font-medium text-muted">{t('settings.theme')}</span>
          <SegmentedControl
            value={uiTheme}
            onChange={onThemeChange}
            options={[
              { value: 'dark', label: t('theme.dark') },
              { value: 'light', label: t('theme.light') },
            ]}
          />
        </div>
      </div>
    </>
  )
}
