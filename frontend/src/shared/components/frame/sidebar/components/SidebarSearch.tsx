'use client'

import { SearchIcon } from 'lucide-react'

import { Kbd, KbdGroup } from '@/shared/components/ui/kbd'
import { SidebarMenuButton, SidebarMenuItem } from '@/shared/components/ui/sidebar'
import { hotkeyKeys, useModifierKeyName } from '@/shared/lib/hotkey'

import { paletteHotkey } from '../../commands/command.constants'
import { useCommandPalette } from '../../commands/hooks/useCommandPalette'

interface SidebarSearchProps {
  /** The name of the button, and its tooltip on the rail, such as "Search". */
  label: string
}

/**
 * The search of the side list, a row of a `SidebarMenu` that opens the command palette, as its
 * hotkey does, with the keys of the hotkey at its end. On the rail of a folded side list it is the
 * icon alone, with the label as its tooltip.
 * @view user
 */
export function SidebarSearch({ label }: SidebarSearchProps) {
  const { setOpen } = useCommandPalette()
  const modifier = useModifierKeyName()

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={label}
        onClick={() => {
          setOpen(true)
        }}
      >
        <SearchIcon aria-hidden />
        <span>{label}</span>
        <KbdGroup className="ml-auto group-data-[collapsible=icon]:hidden" aria-hidden>
          {hotkeyKeys(paletteHotkey, modifier).map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
        </KbdGroup>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
