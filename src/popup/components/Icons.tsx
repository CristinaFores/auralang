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
    <SvgIcon size={size} className={className} stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" />
      <path d="M2 12.8799V11.1199C2 10.0799 2.85 9.21994 3.9 9.21994C5.71 9.21994 6.45 7.93994 5.54 6.36994C5.02 5.46994 5.33 4.29994 6.24 3.77994L7.97 2.78994C8.76 2.31994 9.78 2.59994 10.25 3.38994L10.36 3.57994C11.26 5.14994 12.74 5.14994 13.65 3.57994L13.76 3.38994C14.23 2.59994 15.25 2.31994 16.04 2.78994L17.77 3.77994C18.68 4.29994 18.99 5.46994 18.47 6.36994C17.56 7.93994 18.3 9.21994 20.11 9.21994C21.15 9.21994 22.01 10.0699 22.01 11.1199V12.8799C22.01 13.9199 21.16 14.7799 20.11 14.7799C18.3 14.7799 17.56 16.0599 18.47 17.6299C18.99 18.5399 18.68 19.6999 17.77 20.2199L16.04 21.2099C15.25 21.6799 14.23 21.3999 13.76 20.6099L13.65 20.4199C12.75 18.8499 11.27 18.8499 10.36 20.4199L10.25 20.6099C9.78 21.3999 8.76 21.6799 7.97 21.2099L6.24 20.2199C5.33 19.6999 5.02 18.5299 5.54 17.6299C6.45 16.0599 5.71 14.7799 3.9 14.7799C2.85 14.7799 2 13.9199 2 12.8799Z" />
   
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
