'use client'

import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'
import { useIsHydrated } from '@/shared/lib/hydration/hooks/useIsHydrated'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  // The stored theme is only known in the browser; until hydration no option is marked active.
  const hydrated = useIsHydrated()

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label="Theme"
      value={hydrated ? (theme ?? '') : ''}
      onValueChange={(value) => {
        if (value) {
          setTheme(value)
        }
      }}
    >
      <ToggleGroupItem value="light" aria-label="Light">
        <SunIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark">
        <MoonIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" aria-label="System">
        <MonitorIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
