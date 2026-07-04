import { WaveformBars } from './WaveformBars'

interface StatusCircleProps {
  title: string
  subtitle: string
  // Bars animate while capturing/loading; static in the idle ready state.
  animated?: boolean
  // Circle emphasis: 'none' (idle), 'soft', or 'intense' (pulsing, listening).
  glow?: 'none' | 'soft' | 'intense'
  // Real download progress (0..100), or null when there's no measurable one.
  progress?: number | null
  // Show a bar even without a real percentage (probing, or a cache hit that
  // would otherwise stick at 100%) — falls back to an indeterminate animation.
  loading?: boolean
}

// Single status indicator for both the idle and the active screens. Keeping
// them one component guarantees the circle stays the exact same size and
// position across states, so it never jumps when translation starts.
export function StatusCircle({
  title,
  subtitle,
  animated = true,
  glow = 'none',
  progress = null,
  loading = false,
}: StatusCircleProps) {
  const clampedProgress = progress === null ? null : Math.max(0, Math.min(100, progress))
  // Only fill a determinate bar for genuine mid-download progress; at 0/100/null
  // fall back to an indeterminate bar so it never freezes full or empty.
  const determinate = clampedProgress !== null && clampedProgress > 0 && clampedProgress < 100
  const showBar = loading || determinate

  const circleClass =
    glow === 'none'
      ? 'border-[var(--border-color)] shadow-[var(--surface-shadow)]'
      : glow === 'intense'
        ? 'border-brand-purple/50 glow-purple-intense'
        : 'border-brand-purple/50 glow-purple'

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <div
        className={`relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 bg-[var(--surface-elevated)] ${circleClass}`}
      >
        <WaveformBars animated={animated} />
      </div>
      <div className="flex w-full flex-col items-center gap-1">
        <h2 className="text-h2 font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="max-w-[260px] text-body text-muted">{subtitle}</p>
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
