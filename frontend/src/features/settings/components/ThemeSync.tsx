'use client'

import { useTheme } from 'next-themes'
import { useEffect, useEffectEvent, useRef } from 'react'

import { useSaveTheme } from '../hooks/useSaveTheme'
import { useUserSettings } from '../hooks/useUserSettings'
import type { UserSettings } from '../settings.types'

type Theme = UserSettings['theme']

function isTheme(value: string): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

/**
 * Keeps the theme of the page and the theme of the user settings the same, so that the theme
 * follows the user across devices. The stored theme wins when the settings load or change on
 * another device; a theme chosen on this page (the account menu, the command palette) is saved.
 * The page also keeps its own copy, so that it opens in the right theme before the settings load.
 * Renders nothing.
 */
export function ThemeSync() {
  const { theme, setTheme } = useTheme()
  const settings = useUserSettings()
  const saveTheme = useSaveTheme()
  // The theme known to be the same on the page and in the settings.
  const synced = useRef<Theme | null>(null)
  const stored = settings.data?.theme

  useEffect(() => {
    if (stored === undefined || stored === synced.current) return
    synced.current = stored
    setTheme(stored)
  }, [stored, setTheme])

  const saveThemeOfPage = useEffectEvent((value: Theme) => {
    saveTheme(value)
  })

  useEffect(() => {
    // Before the settings load, the theme of the page is not compared with them.
    if (theme === undefined || synced.current === null || theme === synced.current) return
    if (!isTheme(theme)) return
    synced.current = theme
    saveThemeOfPage(theme)
  }, [theme])

  return null
}
