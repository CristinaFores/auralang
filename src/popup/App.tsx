import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useApiConfig } from './hooks/useApiConfig'
import { useTranslation } from './hooks/useTranslation'
import { useI18n } from './hooks/useI18n'
import { useTheme } from './hooks/useTheme'
import { useErrorToasts } from './hooks/useErrorToasts'
import { Header } from './components/Header'
import { StatusHero } from './components/StatusHero'
import { LanguageSelect } from './components/LanguageSelect'
import { WaveformIndicator } from './components/WaveformIndicator'
import { PrimaryButton } from './components/PrimaryButton'
import { Footer } from './components/Footer'
import { SettingsPanel } from './components/SettingsPanel'
import { LiveCaption } from './components/LiveCaption'
import { PlayIcon, StopIcon } from './components/Icons'
import type { UiLanguage, UiTheme } from '../types'

type OpenSelect = 'source' | 'target' | null

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [openSelect, setOpenSelect] = useState<OpenSelect>(null)
  const { config, updateField, error: saveError } = useApiConfig()
  useTheme(config.uiTheme)
  const { t } = useI18n(config.uiLanguage)
  const { state: translation, toggle } = useTranslation(config)

  useEffect(() => {
    document.documentElement.lang = config.uiLanguage
  }, [config.uiLanguage])

  useErrorToasts({
    translationError: translation.error,
    saveError,
    t,
  })

  const inactiveTitle = translation.isModelReady ? t('readyToTranslate') : t('loadingModel')
  const inactiveDescription = translation.isModelReady
    ? t('readyDescription')
    : t('loadingModelDetail')

  const activeTitle = translation.isLoading ? t('connecting') : t('listening')
  const activeSubtitle = translation.isLoading ? t('connectingDescription') : t('capturingAudio')

  return (
    <>
      <Toaster
        position="top-center"
        containerStyle={{ top: 16 }}
        toastOptions={{
          style: {
            maxWidth: '288px',
            background: 'var(--surface-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            fontSize: '12px',
            lineHeight: '1.4',
          },
          error: {
            style: {
              color: '#f87171',
            },
            iconTheme: {
              primary: '#f87171',
              secondary: 'var(--surface-elevated)',
            },
          },
        }}
      />

      <div className="popup-shell relative flex min-h-screen w-full flex-col overflow-x-hidden p-5">
        <Header
          tagline={t('tagline')}
          settingsAriaLabel={t('settings.openAriaLabel')}
          onOpenSettings={() => {
            setOpenSelect(null)
            setSettingsOpen(true)
          }}
        />

        <SettingsPanel
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          uiLanguage={config.uiLanguage}
          uiTheme={config.uiTheme}
          backdropCloseAriaLabel={t('settings.backdropAriaLabel')}
          closeAriaLabel={t('settings.closeAriaLabel')}
          onLanguageChange={(lang: UiLanguage) => updateField('uiLanguage', lang)}
          onThemeChange={(theme: UiTheme) => updateField('uiTheme', theme)}
          t={t}
        />

        <div className="flex flex-1 flex-col gap-4 pt-4">
          {!translation.isActive ? (
            <>
              <StatusHero
                title={inactiveTitle}
                description={inactiveDescription}
                loading={!translation.isModelReady}
              />

              <div className="flex flex-col gap-3">
                <LanguageSelect
                  label={t('sourceLanguage')}
                  value={config.sourceLanguage}
                  uiLanguage={config.uiLanguage}
                  searchPlaceholder={t('searchLanguage')}
                  noResultsText={t('noResults')}
                  isOpen={openSelect === 'source'}
                  onOpenChange={(open) => setOpenSelect(open ? 'source' : null)}
                  onChange={(value) => updateField('sourceLanguage', value)}
                />
                <LanguageSelect
                  label={t('targetLanguage')}
                  value={config.targetLanguage}
                  uiLanguage={config.uiLanguage}
                  searchPlaceholder={t('searchLanguage')}
                  noResultsText={t('noResults')}
                  isOpen={openSelect === 'target'}
                  onOpenChange={(open) => setOpenSelect(open ? 'target' : null)}
                  onChange={(value) => updateField('targetLanguage', value)}
                  placement="top"
                />
              </div>

              <PrimaryButton
                icon={<PlayIcon />}
                onClick={toggle}
                disabled={!translation.isModelReady || translation.isLoading}
              >
                {translation.isLoading ? t('connecting') : t('startTranslation')}
              </PrimaryButton>
            </>
          ) : (
            <>
              <WaveformIndicator title={activeTitle} subtitle={activeSubtitle} intense />
              <LiveCaption transcript={translation.transcript} translatingLabel={t('translating')} />
              <PrimaryButton
                icon={<StopIcon />}
                onClick={toggle}
                variant="ghost"
                disabled={translation.isLoading}
              >
                {translation.isLoading ? t('connecting') : t('stop')}
              </PrimaryButton>
            </>
          )}
        </div>

        <Footer label={t('tabAudioOnly')} />
      </div>
    </>
  )
}
