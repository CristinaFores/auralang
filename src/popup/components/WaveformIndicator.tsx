import { WaveformBars } from './WaveformBars'

interface WaveformIndicatorProps {
  title: string
  subtitle: string
  intense?: boolean
  // Real download progress (0..100), or null when there's no measurable one.
  progress?: number | null
  // Whether the model is loading. Shows a bar even without a real percentage
  // (e.g. probing, or a cache hit that would otherwise stick at 100%).
  loading?: boolean
}

export function WaveformIndicator({
  title,
  subtitle,
  intense = false,
  progress = null,
  loading = false,
}: WaveformIndicatorProps) {
  const clampedProgress = progress === null ? null : Math.max(0, Math.min(100, progress))
  // Only fill a determinate bar when there's genuine mid-download progress.
  // At 0/100/null we fall back to an indeterminate bar so it never freezes at
  // a full (or empty) bar — a cache hit just animates instead of sticking.
  const determinate = clampedProgress !== null && clampedProgress > 0 && clampedProgress < 100
  const showBar = loading || determinate

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
        {showBar && (
          <div className="mt-2 flex w-52 max-w-full items-center gap-2">
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border-color)]">
              {determinate ? (
                <div
                  className="h-full rounded-full bg-brand-purple transition-[width] duration-300 ease-out"
                  style={{ width: `${clampedProgress}%` }}
                />
              ) : (
                <div className="animate-indeterminate absolute inset-y-0 w-2/5 rounded-full bg-brand-purple" />
              )}
            </div>
            {determinate && (
              <span className="text-caption tabular-nums text-muted">
                {Math.round(clampedProgress)}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
