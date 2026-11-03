'use client'

import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { ButtonGroup } from '@/shared/components/ui/button-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

import { useThemeChoice } from './useThemeChoice'

const themeOptions: { value: string; label: string; Icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
]

/**
 * The buttons that choose the theme of the app: light, dark, or that of the system. Each shows its
 * icon, and its name in a tooltip and to screen readers.
 */
export function ThemePicker() {
  const { chosen, choose } = useThemeChoice()

  return (
    <ButtonGroup aria-label="Theme">
      {themeOptions.map(({ value, label, Icon }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <Button
              variant={chosen === value ? 'default' : 'outline'}
              size="icon"
              // The fill also covers the border, so the chosen button is as large as the outlined ones.
              className="bg-clip-border"
              aria-label={label}
              aria-pressed={chosen === value}
              onClick={() => {
                choose(value)
              }}
            >
              <Icon aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </ButtonGroup>
  )
}
