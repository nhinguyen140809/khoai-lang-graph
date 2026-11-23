'use client'

import { SearchIcon } from 'lucide-react'

import { Kbd, KbdGroup } from '@/shared/components/ui/kbd'
import { ariaKeyShortcuts, hotkeyKeys, useModifierKeyName } from '@/shared/lib/hotkey'

import { useCommandPalette } from '../../palette/hooks/useCommandPalette'
import { paletteHotkey } from '../../palette/palette.constants'

/** Looks like a search box and opens the command palette, as its hotkey does. */
export function SearchButton() {
  const { setOpen: setPaletteOpen } = useCommandPalette()
  const modifier = useModifierKeyName()

  return (
    <button
      type="button"
      aria-keyshortcuts={ariaKeyShortcuts(paletteHotkey)}
      onClick={() => {
        setPaletteOpen(true)
      }}
      className="flex h-9 w-md min-w-0 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
    >
      <SearchIcon aria-hidden className="size-4 shrink-0" />
      <span className="truncate">Search or run a command</span>
      <KbdGroup className="ml-auto" aria-hidden>
        {hotkeyKeys(paletteHotkey, modifier).map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </KbdGroup>
    </button>
  )
}
