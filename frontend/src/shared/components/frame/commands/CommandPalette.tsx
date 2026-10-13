'use client'

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
import { useHotkey } from '@/shared/hooks/useHotkey'
import { useModifierKeyName } from '@/shared/hooks/useModifierKeyName'

import { paletteHotkey } from './command.constants'
import { commandGroups, hotkeyLabel } from './command.utils'
import { useCommandPaletteStore } from './command-palette.store'
import { useCommandRegistryStore } from './command-registry.store'

/**
 * Search and commands, opened with Ctrl+K or the search box of the top bar. It lists the commands
 * that the components on screen register with `useCommands`, and closes when one is chosen. Its
 * rows use the text size of the frame, one step larger than the menus of the components.
 */
export function CommandPalette() {
  const open = useCommandPaletteStore((state) => state.open)
  const setOpen = useCommandPaletteStore((state) => state.setOpen)
  const toggle = useCommandPaletteStore((state) => state.toggle)
  const sources = useCommandRegistryStore((state) => state.sources)
  const modifier = useModifierKeyName()

  useHotkey(paletteHotkey.key, toggle, paletteHotkey)

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
          {commandGroups(sources.values()).map(({ heading, commands }) => (
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
