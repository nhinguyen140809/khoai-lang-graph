'use client'

import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { PaletteGroup, useCommands } from '@/shared/components/frame'

const themes = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
]

/** Registers the commands that choose the theme; `ThemeSync` saves the one chosen. Renders nothing. */
export function ThemeCommands() {
  const { setTheme } = useTheme()

  useCommands(
    themes.map(({ value, label, Icon }) => ({
      id: `view.theme.${value}`,
      label: `Theme: ${label}`,
      group: PaletteGroup.View,
      icon: <Icon />,
      run: () => {
        setTheme(value)
      },
    })),
  )

  return null
}
