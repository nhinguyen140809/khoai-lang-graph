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
} from '@/components/ui/command'
import { useHotkey } from '@/hooks/useHotkey'

import { commandGroups, hotkeyLabel } from './command.utils'
import { useCommandPaletteStore } from './command-palette.store'
import { useCommandRegistryStore } from './command-registry.store'

/**
 * Search and commands, opened with Ctrl+K or the search box of the top bar. It lists the commands
 * that the components on screen register with `useCommands`, and closes when one is chosen.
 */
export function CommandPalette() {
  const open = useCommandPaletteStore((state) => state.open)
  const setOpen = useCommandPaletteStore((state) => state.setOpen)
  const toggle = useCommandPaletteStore((state) => state.toggle)
  const sources = useCommandRegistryStore((state) => state.sources)

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
          {commandGroups(sources.values()).map(({ heading, commands }) => (
            <CommandGroup key={heading} heading={heading}>
              {commands.map(({ id, label, group, icon, hotkey, run }) => (
                <CommandItem
                  key={id}
                  // The search matches the group too; the id keeps two equal labels apart.
                  value={`${group} ${label} ${id}`}
                  disabled={run === undefined}
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
                  {hotkey !== undefined && <CommandShortcut>{hotkeyLabel(hotkey)}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
