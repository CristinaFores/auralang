import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useApiConfig } from './hooks/useApiConfig'
import { useTranslation } from './hooks/useTranslation'
import { useI18n } from './hooks/useI18n'
import type { MessageKey } from './hooks/useI18n'
import { useTheme } from './hooks/useTheme'
import { useErrorToasts } from './hooks/useErrorToasts'
import { useStatusToasts } from './hooks/useStatusToasts'
import { useActiveStatus } from './hooks/useActiveStatus'
import { Header } from './components/Header'
import { StatusCircle } from './components/StatusCircle'
import { LanguageSelect } from './components/LanguageSelect'
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
  // Only one language dropdown open at a time.
  const [openSelect, setOpenSelect] = useState<'source' | 'target' | null>(null)
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

  const activeStatus = useActiveStatus(translation, config.asrMode, t)

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
          {/* Content zone — swaps between idle and active, but stays the same
              flex-1 region. Top-aligned in BOTH states so the status circle
              keeps the same position and never jumps when translation starts. */}
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {!translation.isActive ? (
              <>
                <StatusCircle
                  title={t('readyToTranslate')}
                  subtitle={t('readyDescription')}
                  animated={false}
                  glow="none"
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
                <StatusCircle
                  title={activeStatus.title}
                  subtitle={activeStatus.subtitle}
                  progress={activeStatus.progress}
                  loading={activeStatus.loading}
                  animated
                  glow="intense"
                />
                {/* Only draw the bordered transcript box once there are lines
                    to show. Before that: nothing while the model loads, and a
                    calm centered hint (no empty container) once we're listening,
                    so the waiting space reads as intentional, not unfinished. */}
                {translation.transcripts.length > 0 ? (
                  <TranscriptFeed
                    transcripts={translation.transcripts}
                    translatingLabel={t('translating')}
                    speakingOriginal={translation.speakingOriginal}
                  />
                ) : (
                  translation.isModelReady && (
                    <div className="flex flex-1 items-center justify-center px-6 text-center">
                      <p className="text-body text-muted">{t('playToStart')}</p>
                    </div>
                  )
                )}
              </>
            )}
          </div>

          {/* Fixed controls — same position in every state, so the language
              pickers and the primary button never jump. Pickers stay visible
              (locked, not hidden) while translating. */}
          <div className="flex flex-col gap-3">
            <LanguageSelect
              label={t('sourceLanguage')}
              value={config.sourceLanguage}
              uiLanguage={config.uiLanguage}
              searchPlaceholder={t('searchLanguage')}
              noResultsText={t('noResults')}
              disabled={translation.isActive}
              isOpen={openSelect === 'source'}
              onOpenChange={(open) => setOpenSelect(open ? 'source' : null)}
              onChange={(value) => updateField('sourceLanguage', value)}
              placement="top"
            />
            <LanguageSelect
              label={t('targetLanguage')}
              value={config.targetLanguage}
              uiLanguage={config.uiLanguage}
              searchPlaceholder={t('searchLanguage')}
              noResultsText={t('noResults')}
              disabled={translation.isActive}
              isOpen={openSelect === 'target'}
              onOpenChange={(open) => setOpenSelect(open ? 'target' : null)}
              onChange={(value) => updateField('targetLanguage', value)}
              placement="top"
            />
          </div>

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
