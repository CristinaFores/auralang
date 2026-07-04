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

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [targetOpen, setTargetOpen] = useState(false)
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
  // In Auto mode the label is just "Auto", so we also spell out the concrete
  // tier it resolves to on this device (Light/Balanced) — otherwise the user
  // has no idea which model is actually about to run.
  const selectedTier = tierForMode(config.asrMode)
  const selectedTierLabel = t(`model.${selectedTier.id}` as MessageKey)
  const modelNote =
    config.asrMode === 'auto'
      ? `${t('model.auto')} · ${selectedTierLabel} · ~${selectedTier.approxDownloadMB} MB · ${t('downloadsOnStart')}`
      : `${selectedTierLabel} · ~${selectedTier.approxDownloadMB} MB · ${t('downloadsOnStart')}`

  const modelStatus = translation.modelStatus
  const downloadProgress = modelStatus?.phase === 'downloading' ? modelStatus.progress : null
  const probing = modelStatus?.phase === 'probing'
  const modelLoading = translation.isActive && !translation.isModelReady

  // Which model is actually running: the 'ready' status is authoritative; fall
  // back to the resolved tier so the running model is shown even after reopen.
  const runningTierId = modelStatus?.phase === 'ready' ? modelStatus.tier : selectedTier.id
  const runningModelLabel = t(`model.${runningTierId}` as MessageKey)

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
          : `${t('capturingAudio')} · ${runningModelLabel}`

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
            setTargetOpen(false)
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
          {/* Content zone — swaps between idle and active, but stays the same
              flex-1 region. Top-aligned in BOTH states so the status circle
              keeps the same position and never jumps when translation starts. */}
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {!translation.isActive ? (
              <>
                <StatusHero
                  title={t('readyToTranslate')}
                  description={t('readyDescription')}
                  loading={false}
                />
                <p className="text-center text-caption text-muted">{modelNote}</p>
                {/* Keep the last session's transcript visible after Stop. */}
                {translation.transcripts.length > 0 && (
                  <TranscriptFeed
                    transcripts={translation.transcripts}
                    translatingLabel={t('translating')}
                    speakingOriginal={translation.speakingOriginal}
                  />
                )}
              </>
            ) : (
              <>
                <WaveformIndicator
                  title={activeTitle}
                  subtitle={activeSubtitle}
                  progress={downloadProgress}
                  loading={modelLoading}
                  intense
                />
                {/* Hide the transcript box while the model loads — an empty feed
                    there just reads as a giant blank panel. Once ready, an empty
                    feed tells the user to play the video. */}
                {translation.isModelReady && (
                  <TranscriptFeed
                    transcripts={translation.transcripts}
                    translatingLabel={t('translating')}
                    emptyHint={t('playToStart')}
                    speakingOriginal={translation.speakingOriginal}
                  />
                )}
              </>
            )}
          </div>

          {/* Fixed controls — same position in every state, so the language
              picker and the primary button never jump. The picker is locked
              (not hidden) while translating: the source is auto-detected, so
              only the output language is chosen here. */}
          <LanguageSelect
            label={t('targetLanguage')}
            value={config.targetLanguage}
            uiLanguage={config.uiLanguage}
            searchPlaceholder={t('searchLanguage')}
            noResultsText={t('noResults')}
            disabled={translation.isActive}
            isOpen={targetOpen}
            onOpenChange={setTargetOpen}
            onChange={(value) => updateField('targetLanguage', value)}
            placement="top"
          />

          <PrimaryButton
            icon={translation.isActive ? <StopIcon /> : <PlayIcon />}
            onClick={toggle}
            variant={translation.isActive ? 'ghost' : 'primary'}
            disabled={translation.isLoading}
          >
            {translation.isLoading
              ? t('connecting')
              : translation.isActive
                ? t('stop')
                : t('startTranslation')}
          </PrimaryButton>
        </div>

        <Footer label={t('tabAudioOnly')} />
      </div>
    </>
  )
}
