import { SpeakerIcon } from './Icons'

interface FooterProps {
  label: string
}

export function Footer({ label }: FooterProps) {
  return (
    <footer className="mt-auto flex items-center justify-center gap-1.5 pt-2">
      <SpeakerIcon size={14} className="text-muted" />
      <p className="text-caption text-muted">{label}</p>
    </footer>
  )
}
