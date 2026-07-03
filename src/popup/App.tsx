import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useApiConfig } from './hooks/useApiConfig'
import { useTranslation } from './hooks/useTranslation'
import { useI18n } from './hooks/useI18n'
import type { MessageKey } from './hooks/useI18n'
import { useTheme } from './hooks/useTheme'
import { useErrorToasts } from './hooks/useErrorToasts'
import { useStatusToasts } from './hooks/useStatusToasts'
import { Header } from './components/Header'
import { StatusHero } from './components/StatusHero'
import { LanguageSelect } from './components/LanguageSelect'
import { WaveformIndicator } from './components/WaveformIndicator'
import { PrimaryButton } from './components/PrimaryButton'
import { Footer } from './components/Footer'
import { SettingsPanel } from './components/SettingsPanel'
import { TranscriptFeed } from './components/TranscriptFeed'
import { PlayIcon, StopIcon } from './components/Icons'
import type { UiLanguage, UiTheme } from '../types'
import type { AsrMode } from '../asr/types'
import { tierForMode } from '../asr/registry'

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

  useStatusToasts({ modelStatus: translation.modelStatus, t })

  // The model isn't downloaded until the user hits Start, so the idle screen
  // shows which model will be pulled and its size — nothing downloads silently.
  const selectedTier = tierForMode(config.asrMode)
  const modelNote = `${t(`model.${config.asrMode}` as MessageKey)} · ~${selectedTier.approxDownloadMB} MB · ${t('downloadsOnStart')}`

  const modelStatus = translation.modelStatus
  const downloadProgress = modelStatus?.phase === 'downloading' ? modelStatus.progress : null
  const probing = modelStatus?.phase === 'probing'
  const modelLoading = translation.isActive && !translation.isModelReady

  const activeTitle = translation.isLoading
    ? t('connecting')
    : downloadProgress !== null
      ? t('downloadingModel')
      : modelLoading
        ? t('loadingModel')
        : t('listening')
  const activeSubtitle = translation.isLoading
    ? t('connectingDescription')
    : downloadProgress !== null
      ? t('downloadingModelDetail')
      : probing
        ? t('preparingModel')
        : modelLoading
          ? t('loadingModelDetail')
          : t('capturingAudio')

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

      <div className="popup-shell relative flex h-screen w-full flex-col overflow-x-hidden p-5">
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
          asrMode={config.asrMode}
          asrModeLocked={translation.isActive}
          backdropCloseAriaLabel={t('settings.backdropAriaLabel')}
          closeAriaLabel={t('settings.closeAriaLabel')}
          onLanguageChange={(lang: UiLanguage) => updateField('uiLanguage', lang)}
          onThemeChange={(theme: UiTheme) => updateField('uiTheme', theme)}
          onAsrModeChange={(mode: AsrMode) => updateField('asrMode', mode)}
          t={t}
        />

        <div className="flex min-h-0 flex-1 flex-col gap-4 pt-4">
          {!translation.isActive ? (
            <>
              <StatusHero
                title={t('readyToTranslate')}
                description={t('readyDescription')}
                loading={false}
              />

              <p className="text-center text-caption text-muted">{modelNote}</p>

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

              {/* Keep the last session's transcript visible after Stop. */}
              {translation.transcripts.length > 0 && (
                <TranscriptFeed
                  transcripts={translation.transcripts}
                  translatingLabel={t('translating')}
                  speakingOriginal={translation.speakingOriginal}
                />
              )}

              <PrimaryButton icon={<PlayIcon />} onClick={toggle} disabled={translation.isLoading}>
                {translation.isLoading ? t('connecting') : t('startTranslation')}
              </PrimaryButton>
            </>
          ) : (
            <>
              <WaveformIndicator
                title={activeTitle}
                subtitle={activeSubtitle}
                progress={downloadProgress}
                intense
              />
              {/* Hide the transcript box while the model loads — an empty
                  feed there just reads as a giant blank panel. Once ready, an
                  empty feed tells the user to play the video. */}
              {translation.isModelReady && (
                <TranscriptFeed
                  transcripts={translation.transcripts}
                  translatingLabel={t('translating')}
                  emptyHint={t('playToStart')}
                  speakingOriginal={translation.speakingOriginal}
                />
              )}
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
