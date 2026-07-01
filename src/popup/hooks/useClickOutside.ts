import { useEffect, type RefObject } from 'react'

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutside: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return

    const handlePointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        onOutside()
      }
    }

    document.addEventListener('mousedown', handlePointer)
    return () => document.removeEventListener('mousedown', handlePointer)
  }, [ref, onOutside, enabled])
}
