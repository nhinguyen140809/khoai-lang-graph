import { useSyncExternalStore } from 'react'

import { useSettingsStore } from '../settings.store'

const darkQuery = '(prefers-color-scheme: dark)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(darkQuery)
  media.addEventListener('change', onChange)
  return () => {
    media.removeEventListener('change', onChange)
  }
}

function prefersDark() {
  return window.matchMedia(darkQuery).matches
}

/** The theme actually applied: `system` resolved against the OS preference. */
export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useSettingsStore((state) => state.theme)
  const systemDark = useSyncExternalStore(subscribe, prefersDark)
  if (theme === 'system') return systemDark ? 'dark' : 'light'
  return theme
}
