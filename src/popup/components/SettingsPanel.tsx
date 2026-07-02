import type { UiLanguage, UiTheme } from '../../types'
import type { AsrMode } from '../../asr/types'
import { CloseIcon } from './Icons'
import { SegmentedControl } from './SegmentedControl'
import type { MessageKey } from '../hooks/useI18n'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  uiLanguage: UiLanguage
  uiTheme: UiTheme
  asrMode: AsrMode
  asrModeLocked: boolean
  backdropCloseAriaLabel: string
  closeAriaLabel: string
  onLanguageChange: (lang: UiLanguage) => void
  onThemeChange: (theme: UiTheme) => void
  onAsrModeChange: (mode: AsrMode) => void
  t: (key: MessageKey) => string
}

export function SettingsPanel({
  isOpen,
  onClose,
  uiLanguage,
  uiTheme,
  asrMode,
  asrModeLocked,
  backdropCloseAriaLabel,
  closeAriaLabel,
  onLanguageChange,
  onThemeChange,
  onAsrModeChange,
  t,
}: SettingsPanelProps) {
  if (!isOpen) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 bg-black/50 z-10"
        onClick={onClose}
        aria-label={backdropCloseAriaLabel}
      />
      <div className="transcript-feed absolute inset-x-3 top-14 z-20 flex max-h-[calc(100vh-5rem)] flex-col gap-4 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--surface-elevated)] p-4 shadow-[0_12px_32px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between">
          <h2 className="text-body font-semibold text-[var(--text-primary)]">{t('settings.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-[var(--text-primary)] transition-colors"
            aria-label={closeAriaLabel}
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

        <div className="flex flex-col gap-1.5">
          <span className="text-caption font-medium text-muted">{t('settings.model')}</span>
          <SegmentedControl
            value={asrMode}
            onChange={onAsrModeChange}
            disabled={asrModeLocked}
            options={[
              { value: 'auto', label: t('model.auto') },
              { value: 'light', label: t('model.light') },
              { value: 'balanced', label: t('model.balanced') },
            ]}
          />
          <span className="text-caption leading-snug text-muted">
            {asrModeLocked
              ? t('model.lockedHint')
              : asrMode === 'balanced'
                ? t('model.balancedHint')
                : asrMode === 'light'
                  ? t('model.lightHint')
                  : t('model.autoHint')}
          </span>
        </div>
      </div>
    </>
  )
}
