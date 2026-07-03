import { WaveformBars } from './WaveformBars'

interface WaveformIndicatorProps {
  title: string
  subtitle: string
  intense?: boolean
  // Download progress (0..100). When provided, renders a progress bar so the
  // model download is unmistakable — not just a percentage in the subtitle.
  progress?: number | null
}

export function WaveformIndicator({
  title,
  subtitle,
  intense = false,
  progress = null,
}: WaveformIndicatorProps) {
  const clampedProgress = progress === null ? null : Math.max(0, Math.min(100, progress))

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <div
        className={`relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-brand-purple/50 bg-[var(--surface-elevated)] ${
          intense ? 'glow-purple-intense' : 'glow-purple'
        }`}
      >
        <WaveformBars />
      </div>
      <div className="flex w-full flex-col items-center gap-1">
        <h2 className="text-h2 font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="text-body text-muted">{subtitle}</p>
        {clampedProgress !== null && (
          <div className="mt-2 flex w-52 max-w-full items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border-color)]">
              <div
                className="h-full rounded-full bg-brand-purple transition-[width] duration-300 ease-out"
                style={{ width: `${clampedProgress}%` }}
              />
            </div>
            <span className="text-caption tabular-nums text-muted">
              {Math.round(clampedProgress)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
