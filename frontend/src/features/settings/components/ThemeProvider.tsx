import { type ReactNode, useEffect } from 'react'

import { useResolvedTheme } from '../hooks/useResolvedTheme'

interface ThemeProviderProps {
  children: ReactNode
}

/** Applies the chosen theme to <html> so Tailwind's `dark:` variant follows the settings store. */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useResolvedTheme()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return children
}
