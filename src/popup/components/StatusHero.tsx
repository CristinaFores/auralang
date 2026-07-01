import { WaveformBars } from './WaveformBars'

interface StatusHeroProps {
  title: string
  description: string
}

export function StatusHero({ title, description }: StatusHeroProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-2 text-center">
      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-2 border-[var(--border-color)] bg-[var(--surface-elevated)] shadow-[var(--surface-shadow)]">
        <WaveformBars size="lg" animated={false} />
      </div>
      <h2 className="text-h2 font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="max-w-[260px] text-body text-muted">{description}</p>
    </div>
  )
}
