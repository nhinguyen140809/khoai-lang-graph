'use client'

import { FileTextIcon, HistoryIcon, RotateCcwIcon, SquareIcon, UploadIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/shared/components/ui/command'

import { specRequirements } from '../../../design-system.fixtures'
import type { CardEntry } from '../../../design-system.types'
import { SampleCard } from '../../Sample'

export function CommandCard() {
  // Shown in a dialog: an inline palette selects its first item on mount and scrolls the page to it.
  const [open, setOpen] = useState(false)

  return (
    <SampleCard
      title="Command palette"
      description="Search items or run a command."
      className="flex items-center justify-between gap-2"
    >
      <Button
        variant="outline"
        onClick={() => {
          setOpen(true)
        }}
      >
        Open the command palette
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        {/* This CommandDialog does not render the Command root itself. */}
        <Command>
          <CommandInput placeholder="Search items or run a command" />
          <CommandList>
            <CommandEmpty>Nothing found.</CommandEmpty>
            <CommandGroup heading="Go to item">
              {specRequirements.slice(0, 3).map((row) => (
                <CommandItem key={row.key}>
                  <FileTextIcon />
                  <span className="font-mono">{row.key}</span>
                  {row.title}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Run">
              <CommandItem>
                <SquareIcon />
                Stop the run
                <CommandShortcut>Esc</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <RotateCcwIcon />
                Retry from a step
              </CommandItem>
              <CommandItem>
                <HistoryIcon />
                Show the run history
              </CommandItem>
              <CommandItem>
                <UploadIcon />
                Export the specification
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </SampleCard>
  )
}

export const commandCardEntry = {
  id: 'command',
  label: 'Command palette',
  section: 'actions',
  span: 3,
  keywords:
    'command cmdk search menu Command CommandDialog CommandEmpty CommandGroup CommandInput CommandItem CommandList CommandSeparator CommandShortcut',
  View: CommandCard,
} satisfies CardEntry
