import type { SVGProps } from 'react'

type SvgIconProps = SVGProps<SVGSVGElement> & {
  size?: number
}

function SvgIcon({ size = 16, className = '', children, viewBox = '0 0 24 24', ...props }: SvgIconProps) {
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`block shrink-0 ${className}`}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

interface IconProps {
  className?: string
  size?: number
}

export function SunIcon({ className = '', size = 18 }: IconProps) {
  return (
    <SvgIcon size={size} className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </SvgIcon>
  )
}

export function MoonIcon({ className = '', size = 18 }: IconProps) {
  return (
    <SvgIcon size={size} className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A7.5 7.5 0 0 1 9.5 4 6 6 0 1 0 20 14.5Z" />
    </SvgIcon>
  )
}

export function GearIcon({ className = '', size = 18 }: IconProps) {
  return (
    <SvgIcon size={size} className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </SvgIcon>
  )
}

export function PlayIcon({ className = '', size = 20 }: IconProps) {
  return (
    <SvgIcon size={size} className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 3.5v17l16-8.5L6 3.5Z" />
    </SvgIcon>
  )
}

export function StopIcon({ className = '', size = 20 }: IconProps) {
  return (
    <SvgIcon size={size} className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="5" width="14" height="14" rx="3" />
    </SvgIcon>
  )
}

export function SpeakerIcon({ className = '', size = 14 }: IconProps) {
  return (
    <SvgIcon size={size} className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a4.5 4.5 0 0 1 0 7M18.5 5.5a8 8 0 0 1 0 13" />
    </SvgIcon>
  )
}

export function CloseIcon({ className = '', size = 16 }: IconProps) {
  return (
    <SvgIcon size={size} className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </SvgIcon>
  )
}

export function SearchIcon({ className = '', size = 16 }: IconProps) {
  return (
    <SvgIcon size={size} className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16.5 16.5 3.5 3.5" />
    </SvgIcon>
  )
}

export function ChevronDownIcon({ className = '', size = 16 }: IconProps) {
  return (
    <SvgIcon size={size} className={className} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </SvgIcon>
  )
}

export function CheckIcon({ className = '', size = 16 }: IconProps) {
  return (
    <SvgIcon size={size} className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </SvgIcon>
  )
}
