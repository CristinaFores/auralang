import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import type { ModelStatus } from '../../asr/types'
import type { MessageKey } from './useI18n'

interface UseStatusToastsOptions {
  modelStatus: ModelStatus | null
  t: (key: MessageKey) => string
}

// Surfaces model lifecycle transitions as toasts. Without this the only "ready"
// signal was a subtle subtitle change under the waveform, which users missed.
export function useStatusToasts({ modelStatus, t }: UseStatusToastsOptions) {
  const lastPhase = useRef<ModelStatus['phase'] | null>(null)

  useEffect(() => {
    const phase = modelStatus?.phase ?? null
    const previous = lastPhase.current
    if (phase === previous) return
    lastPhase.current = phase

    // Fire once, only when the model actually finishes loading during this
    // session — not when the popup reopens on an already-ready model (that path
    // never sets modelStatus, so previous stays null and we skip the toast).
    if (phase === 'ready' && previous !== null && previous !== 'ready') {
      toast.success(t('modelReady'), {
        id: 'model-ready',
        style: {
          border: '1px solid rgba(108, 77, 255, 0.4)',
          color: 'var(--text-primary)',
        },
        iconTheme: { primary: '#6C4DFF', secondary: 'var(--surface-elevated)' },
      })
    }
  }, [modelStatus, t])
}
