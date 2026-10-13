'use client'

import { FileTextIcon, HistoryIcon, RotateCcwIcon, SquareIcon, UploadIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/shared/ui/button'
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
} from '@/shared/ui/command'
import { Kbd, KbdGroup } from '@/shared/ui/kbd'

import { specRequirements } from '../../design-system.fixtures'
import { SampleCard } from '../Sample'

export function CommandCard() {
  // Shown in a dialog: an inline palette selects its first item on mount and scrolls the page to it.
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

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
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
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
