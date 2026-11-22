'use client'

import { ArrowDownIcon, ArrowUpIcon, CornerDownLeftIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'

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
import { Kbd, KbdGroup } from '@/shared/components/ui/kbd'
import { hotkeyLabel, useModifierKeyName } from '@/shared/lib/hotkey'

import { PaletteGroup, paletteHotkey, paletteKeyHints } from '../command.constants'
import type { PaletteCommandGroup } from '../command.types'
import { commandMatchScore, commandSearchText, groupsBySearch } from '../command.utils'
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
      className="top-12 sm:max-w-2xl"
      description="Go to a page or run a command."
    >
      <PaletteSearch
        groups={groups}
        onChosen={() => {
          setOpen(false)
        }}
      />
    </CommandDialog>
  )
}

/**
 * The keys that move through the palette, in a row under the commands: the arrows to move, Enter
 * to choose, Escape to close. The palette reads the keys itself; this row only tells them.
 */
const rowKeyHints = [
  { keys: [<ArrowUpIcon />, <ArrowDownIcon />], hint: paletteKeyHints.move },
  { keys: [<CornerDownLeftIcon />], hint: paletteKeyHints.choose },
  { keys: ['Esc'], hint: paletteKeyHints.close },
]

function PaletteKeyHints() {
  return (
    <div className="flex items-center gap-4 border-t px-3 py-2 text-xs text-muted-foreground">
      {rowKeyHints.map(({ keys, hint }) => (
        <span key={hint} className="flex items-center gap-1.5">
          <KbdGroup aria-hidden>
            {keys.map((key, index) => (
              <Kbd key={index}>{key}</Kbd>
            ))}
          </KbdGroup>
          {hint}
        </span>
      ))}
    </div>
  )
}

interface PaletteSearchProps {
  groups: PaletteCommandGroup[]
  /** Runs before the command chosen, to close the palette. */
  onChosen: () => void
}

/**
 * The search and the commands, the group of the best match first while it searches. It leaves with
 * the palette when the palette closes, so that the palette opens again without a search.
 */
function PaletteSearch({ groups, onChosen }: PaletteSearchProps) {
  const modifier = useModifierKeyName()
  const [search, setSearch] = useState('')

  return (
    // This CommandDialog does not render the Command root itself.
    <Command filter={commandMatchScore}>
      <CommandInput
        placeholder="Search or run a command"
        className="text-sm"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="max-h-120">
        <CommandEmpty>Nothing found.</CommandEmpty>
        {groupsBySearch(groups, search).map(({ heading, commands }) => (
          <CommandGroup key={heading} heading={heading}>
            {commands.map((command) => {
              const { id, label, icon, variant = 'default', hotkey, run } = command
              return (
                <CommandItem
                  key={id}
                  value={commandSearchText(command)}
                  disabled={run === undefined}
                  data-variant={variant}
                  // A destructive command keeps the color of an error when it is selected, as a
                  // destructive item of a menu does.
                  className="min-h-9 text-sm data-[variant=destructive]:text-destructive data-[variant=destructive]:data-selected:bg-destructive/10 data-[variant=destructive]:data-selected:text-destructive dark:data-[variant=destructive]:data-selected:bg-destructive/20 [&_svg:not([class*='size-'])]:size-4"
                  onSelect={() => {
                    onChosen()
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
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
      <PaletteKeyHints />
    </Command>
  )
}
