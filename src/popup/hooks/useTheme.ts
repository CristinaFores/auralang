import { useEffect } from 'react'
import type { UiTheme } from '../../types'

export function useTheme(theme: UiTheme) {
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])
}

export function toggleTheme(current: UiTheme): UiTheme {
  return current === 'dark' ? 'light' : 'dark'
}
