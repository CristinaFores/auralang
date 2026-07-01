import { WaveformBars } from './WaveformBars'

interface WaveformIndicatorProps {
  title: string
  subtitle: string
  intense?: boolean
}

export function WaveformIndicator({ title, subtitle, intense = false }: WaveformIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <div
        className={`relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-brand-purple/50 bg-[var(--surface-elevated)] ${
          intense ? 'glow-purple-intense' : 'glow-purple'
        }`}
      >
        <WaveformBars />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="text-body text-muted">{subtitle}</p>
      </div>
    </div>
  )
}
