import { useState, useEffect } from 'react'
import { useApiConfig } from './hooks/useApiConfig'
import { useTranslation } from './hooks/useTranslation'
import { useI18n } from './hooks/useI18n'
import { useTheme } from './hooks/useTheme'
import { Header } from './components/Header'
import { StatusHero } from './components/StatusHero'
import { LanguageSelect } from './components/LanguageSelect'
import { WaveformIndicator } from './components/WaveformIndicator'
import { PrimaryButton } from './components/PrimaryButton'
import { Footer } from './components/Footer'
import { SettingsPanel } from './components/SettingsPanel'
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

  const inactiveTitle = translation.isModelReady ? t('readyToTranslate') : t('loadingModel')
  const inactiveDescription = translation.isModelReady
    ? t('readyDescription')
    : t('loadingModelDetail')

  const activeTitle = translation.isLoading ? t('connecting') : t('listening')
  const activeSubtitle = translation.isLoading ? t('connectingDescription') : t('capturingAudio')

  return (
    <div className="popup-shell relative flex w-80 h-[560px] flex-col overflow-x-hidden p-5">
      <Header
        tagline={t('tagline')}
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
        onLanguageChange={(lang: UiLanguage) => updateField('uiLanguage', lang)}
        onThemeChange={(theme: UiTheme) => updateField('uiTheme', theme)}
        t={t}
      />

      <div className="flex flex-1 flex-col justify-center gap-4">
        {!translation.isActive ? (
          <>
            <StatusHero title={inactiveTitle} description={inactiveDescription} />

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

        {translation.error && (
          <p className="text-center text-caption text-red-400">{translation.error}</p>
        )}

        {saveError && (
          <p className="text-center text-caption text-red-400">{t('saveError')}</p>
        )}
      </div>

      <Footer label={t('tabAudioOnly')} />
    </div>
  )
}
