'use client'

import { MonitorIcon, MoonIcon, PanelLeftIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import type { ReactNode } from 'react'

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import { useHotkey } from '@/hooks/useHotkey'

import { useFrameStore } from '../frame.store'
import { useCommandPaletteStore } from './command-palette.store'

const themes = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
]

interface CommandPaletteProps {
  /** Command groups of the screen, shown before the View group. Each closes the palette. */
  children?: ReactNode
  /** Offers the command that hides and shows the side panel. */
  sidePanelCommand?: boolean
}

/** Search and commands, opened with Ctrl+K or the search box of the top bar. */
export function CommandPalette({ children, sidePanelCommand = false }: CommandPaletteProps) {
  const open = useCommandPaletteStore((state) => state.open)
  const setOpen = useCommandPaletteStore((state) => state.setOpen)
  const toggle = useCommandPaletteStore((state) => state.toggle)
  const toggleSidePanel = useFrameStore((state) => state.toggleSidePanel)
  const { setTheme } = useTheme()

  useHotkey('k', toggle, { mod: true })

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Go to a page or a project, or run a command."
    >
      {/* This CommandDialog does not render the Command root itself. */}
      <Command>
        <CommandInput placeholder="Search or run a command" />
        <CommandList>
          <CommandEmpty>Nothing found.</CommandEmpty>
          {children}
          <CommandGroup heading="View">
            {sidePanelCommand && (
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  toggleSidePanel()
                }}
              >
                <PanelLeftIcon aria-hidden />
                Toggle side panel
                <CommandShortcut>Ctrl+B</CommandShortcut>
              </CommandItem>
            )}
            {themes.map(({ value, label, Icon }) => (
              <CommandItem
                key={value}
                value={`Theme ${label}`}
                onSelect={() => {
                  setOpen(false)
                  setTheme(value)
                }}
              >
                <Icon aria-hidden />
                Theme: {label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
