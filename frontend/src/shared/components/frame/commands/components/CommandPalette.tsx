'use client'

import { SearchIcon } from 'lucide-react'

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/shared/components/ui/command'
import { useModifierKeyName } from '@/shared/hooks/useModifierKeyName'
import { hotkeyLabel } from '@/shared/lib/hotkey.utils'

import { PaletteGroup, paletteHotkey } from '../command.constants'
import { useCommandPalette } from '../hooks/useCommandPalette'
import { useCommands } from '../hooks/useCommands'

/**
 * Search and commands, opened with Ctrl+K or the search box of the top bar. It lists the commands
 * that the components on screen register with `useCommands`, its own included: Show all commands,
 * whose hotkey Ctrl+K opens and closes it. It closes when a command is chosen. Its rows use the
 * text size of the menus of the components.
 */
export function CommandPalette() {
  const { open, setOpen, toggle, groups } = useCommandPalette()
  const modifier = useModifierKeyName()

  useCommands([
    {
      id: 'view.commandPalette',
      label: 'Show all commands',
      group: PaletteGroup.View,
      icon: <SearchIcon />,
      hotkey: paletteHotkey,
      run: toggle,
    },
  ])

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Go to a page or a project, or run a command."
    >
      {/* This CommandDialog does not render the Command root itself. */}
      <Command>
        <CommandInput placeholder="Search or run a command" className="text-sm" />
        <CommandList>
          <CommandEmpty>Nothing found.</CommandEmpty>
          {groups.map(({ heading, commands }) => (
            <CommandGroup key={heading} heading={heading}>
              {commands.map(({ id, label, group, icon, hotkey, run }) => (
                <CommandItem
                  key={id}
                  // The search matches the group too; the id keeps two equal labels apart.
                  value={`${group} ${label} ${id}`}
                  disabled={run === undefined}
                  className="min-h-9 text-sm [&_svg:not([class*='size-'])]:size-4"
                  onSelect={() => {
                    setOpen(false)
                    run?.()
                  }}
                >
                  {icon !== undefined && (
                    <span aria-hidden className="flex">
                      {icon}
                    </span>
                  )}
                  {label}
                  {hotkey !== undefined && (
                    <CommandShortcut className="text-xs">
                      {hotkeyLabel(hotkey, modifier)}
                    </CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
