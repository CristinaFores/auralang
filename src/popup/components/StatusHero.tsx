import { WaveformBars } from './WaveformBars'

interface StatusHeroProps {
  title: string
  description: string
  loading?: boolean
}

export function StatusHero({ title, description, loading = false }: StatusHeroProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-2 text-center">
      <div
        className={`flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-2 bg-[var(--surface-elevated)] shadow-[var(--surface-shadow)] ${
          loading ? 'border-brand-purple/40' : 'border-[var(--border-color)]'
        }`}
      >
        <WaveformBars animated={loading} />
      </div>
      <h2 className="text-h2 font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="max-w-[260px] text-body text-muted">{description}</p>
    </div>
  )
}
