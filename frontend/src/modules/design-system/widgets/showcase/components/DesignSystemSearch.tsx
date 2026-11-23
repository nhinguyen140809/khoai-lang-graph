'use client'

import { SearchIcon } from 'lucide-react'
import { useCallback, useState } from 'react'

import { Button } from '@/shared/components/ui/button'
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
import { ariaKeyShortcuts, hotkeyKeys, useHotkey, useModifierKeyName } from '@/shared/lib/hotkey'

import { searchHotkey } from '../design-system.constants'
import { sectionGroups, sections } from '../design-system.types'
import { rankCards } from '../design-system.utils'
import { cards } from './cards'

/**
 * Search over every card of every tab, opened with Ctrl+K (Cmd+K on Apple devices) or its button.
 * Choosing a card opens its tab and scrolls to it. The words of a card are its name, its keywords
 * and the name of its tab.
 */
export function DesignSystemSearch({
  onChoose,
}: {
  onChoose: (card: string, section: string) => void
}) {
  const [open, setOpen] = useState(false)
  const modifier = useModifierKeyName()
  const toggle = useCallback(() => {
    setOpen((value) => !value)
  }, [])
  useHotkey(searchHotkey, toggle)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        aria-keyshortcuts={ariaKeyShortcuts(searchHotkey)}
        onClick={() => {
          setOpen(true)
        }}
      >
        <SearchIcon />
        Search
        <KbdGroup aria-hidden>
          {hotkeyKeys(searchHotkey, modifier).map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
        </KbdGroup>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search the design system"
        description="Go to a card of any tab."
      >
        <CardSearch
          onChosen={(card, section) => {
            setOpen(false)
            onChoose(card, section)
          }}
        />
      </CommandDialog>
    </>
  )
}

const sectionLabels = new Map<string, string>(
  sections.map((section) => [section.id, section.label]),
)
const sectionLabelOf = (card: { section: string }) => sectionLabels.get(card.section) ?? ''

/**
 * The search and its results. Without a search the cards are in groups, by tab; with one they are
 * a single list, the best match first. cmdk orders the items of a group, not the groups, so a card
 * of a late tab would sit below the cards of the early ones whatever its match. The state leaves
 * with the dialog, so that it opens again without a search.
 */
function CardSearch({ onChosen }: { onChosen: (card: string, section: string) => void }) {
  const [search, setSearch] = useState('')
  const isSearching = search.trim() !== ''

  const item = (card: (typeof cards)[number]) => (
    <CommandItem
      key={card.id}
      value={card.id}
      onSelect={() => {
        onChosen(card.id, card.section)
      }}
    >
      {card.label}
      <CommandShortcut>{sectionLabelOf(card)}</CommandShortcut>
    </CommandItem>
  )

  return (
    // This CommandDialog does not render the Command root itself. The list is ordered here.
    <Command shouldFilter={false}>
      <CommandInput placeholder="Search a component" value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>Nothing found.</CommandEmpty>
        {isSearching ? (
          <CommandGroup>{rankCards(cards, sectionLabelOf, search).map(item)}</CommandGroup>
        ) : (
          sectionGroups.flatMap((group) =>
            sections
              .filter((section) => section.group === group.id)
              .map((section) => (
                <CommandGroup key={section.id} heading={`${group.label} / ${section.label}`}>
                  {cards.filter((card) => card.section === section.id).map(item)}
                </CommandGroup>
              )),
          )
        )}
      </CommandList>
    </Command>
  )
}
