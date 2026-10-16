'use client'

import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { useIsHydrated } from '@/shared/hooks/useIsHydrated'

const themeOptions: { value: string; label: string; Icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
]

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  // The stored theme is only known in the browser; until hydration no option is marked active.
  const hydrated = useIsHydrated()
  const activeTheme = hydrated ? theme : undefined

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Stored in this browser only.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2" role="group" aria-label="Theme">
          {themeOptions.map(({ value, label, Icon }) => (
            <Button
              key={value}
              variant={activeTheme === value ? 'default' : 'outline'}
              aria-pressed={activeTheme === value}
              onClick={() => {
                setTheme(value)
              }}
            >
              <Icon aria-hidden />
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Models</CardTitle>
          <CardDescription>
            Per-role model selection arrives with GET /api/v1/models (docs/PLANNING.md section 5).
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
