import type { AsrMode } from '../../asr/types'
import type { TranslationState } from '../../types'
import { tierForMode } from '../../asr/registry'
import type { MessageKey } from './useI18n'

export interface ActiveStatus {
  title: string
  subtitle: string
  progress: number | null
  loading: boolean
}

// Derives the title/subtitle/progress shown on the active screen from the
// translation state. Pure derivation extracted from App so the (fiddly) phase
// logic lives in one place and can be reasoned about on its own.
export function useActiveStatus(
  translation: TranslationState,
  asrMode: AsrMode,
  t: (key: MessageKey) => string,
): ActiveStatus {
  const modelStatus = translation.modelStatus
  const downloadProgress = modelStatus?.phase === 'downloading' ? modelStatus.progress : null
  const probing = modelStatus?.phase === 'probing'
  const loading = translation.isActive && !translation.isModelReady

  // Which model is actually running: the 'ready' status is authoritative; fall
  // back to the resolved tier so it's shown even after the popup reopens.
  const runningTierId = modelStatus?.phase === 'ready' ? modelStatus.tier : tierForMode(asrMode).id
  const runningModelLabel = t(`model.${runningTierId}` as MessageKey)

  const title = translation.isLoading
    ? t('connecting')
    : downloadProgress !== null
      ? t('downloadingModel')
      : loading
        ? t('loadingModel')
        : t('listening')

  const subtitle = translation.isLoading
    ? t('connectingDescription')
    : downloadProgress !== null
      ? t('downloadingModelDetail')
      : probing
        ? t('preparingModel')
        : loading
          ? t('loadingModelDetail')
          : `${t('capturingAudio')} · ${runningModelLabel}`

  return { title, subtitle, progress: downloadProgress, loading }
}
