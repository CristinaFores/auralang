import { LogoIcon } from './LogoIcon'
import { GearIcon } from './Icons'

interface HeaderProps {
  tagline: string
  onOpenSettings: () => void
  settingsAriaLabel: string
}

export function Header({ tagline, onOpenSettings, settingsAriaLabel }: HeaderProps) {
  return (
    <header className="flex items-center gap-3">
      <LogoIcon className="h-10 w-10" />
      <div className="min-w-0 flex-1">
        <h1 className="text-body font-semibold leading-tight text-[var(--text-primary)]">AuraLang</h1>
        <p className="text-caption leading-snug text-muted">{tagline}</p>
      </div>
      <button
        type="button"
        onClick={onOpenSettings}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent text-muted transition-colors hover:border-[var(--border-color)] hover:bg-[var(--surface-elevated)] hover:text-brand-purple"
        aria-label={settingsAriaLabel}
      >
        <GearIcon size={18} />
      </button>
    </header>
  )
}
