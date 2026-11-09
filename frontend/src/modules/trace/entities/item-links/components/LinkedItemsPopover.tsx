'use client'

import type { ReactNode } from 'react'

import { useItemHref } from '@/modules/artifact/entities/@x/trace'
import {
  useContentSchemas,
  useItemTitleOf,
  useLinkTitleOf,
} from '@/modules/workflow/entities/@x/trace'
import { ColoredText } from '@/shared/components/ui/colored-text'
import { HighlightMark } from '@/shared/components/ui/highlight'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Separator } from '@/shared/components/ui/separator'

import type { LinkedEntry, LinkedRelation } from '../item-links.types'
import { linkedItemMessages } from '../linked-items.constants'
import { LinkedItemCard } from './LinkedItemCard'

/**
 * How the item of the card relates to the one the page shows, as one sentence under the card: the
 * page's item is "this item", whatever end of the link it is, and the type of the link reads
 * between the two, by its words when the map holds them, else by its title.
 */
export function relationSentence(
  relation: LinkedRelation,
  otherTitle: string,
  titleOf: (linkType: string) => string,
): string {
  const wordsOf = (linkType: string) =>
    linkedItemMessages.linkTypeWords[linkType] ?? linkedItemMessages.hasALinkTo(titleOf(linkType))
  switch (relation.direction) {
    case 'outgoing':
      return `${linkedItemMessages.thisItem} ${wordsOf(relation.linkType)} ${otherTitle}.`
    case 'incoming':
      return `${otherTitle} ${wordsOf(relation.linkType)} this item.`
    case 'quotes':
      return linkedItemMessages.quotesSentence(otherTitle)
  }
}

/** One entry of the card: the card of the item, the sentence of the relation under it, the words
 * the link quotes at its other end in the color of that end, and the problem of an old link. */
function LinkedEntryBlock({
  entry,
  hrefOf,
  linkTitleOf,
  actions,
}: {
  entry: LinkedEntry
  hrefOf: ReturnType<typeof useItemHref>
  /** The title of the type of a link, as the definition of the workflow names it. */
  linkTitleOf: (linkType: string) => string
  /** What the caller offers to do with the link of this entry, such as removing it. */
  actions: ReactNode
}) {
  const schemas = useContentSchemas()
  const titleOf = useItemTitleOf()
  const schema = schemas.get(entry.item.kind)
  const title = titleOf(entry.item)

  return (
    <div className="space-y-2">
      <LinkedItemCard
        href={hrefOf(entry.item)}
        over={schema?.title ?? entry.item.kind}
        title={title}
        actions={actions}
      />
      <p className="text-xs">{relationSentence(entry.relation, title, linkTitleOf)}</p>
      {entry.otherQuote !== null && (
        <p className="text-sm">
          <HighlightMark variant="soft" color={entry.quoteColor}>
            {entry.otherQuote}
          </HighlightMark>
        </p>
      )}
      {entry.isOutOfDate && entry.madeFromVersion !== null && (
        <p className="text-xs">
          <ColoredText color="warning">
            {linkedItemMessages.outOfDate(entry.madeFromVersion, entry.item.version)}
          </ColoredText>
        </p>
      )}
    </div>
  )
}

/**
 * A card that opens on a click of its trigger, with the items at the other end of a link: each one
 * a card of its own that opens its page, the sentence of the relation under it, and the words the
 * link quotes at its other end, in the color of that end.
 */
export function LinkedItemsPopover({
  projectId,
  entries,
  renderActions,
  children,
}: {
  projectId: string
  entries: readonly LinkedEntry[]
  /** Draws what the card of each entry offers to do with its link; nothing by default. */
  renderActions?: ((entry: LinkedEntry) => ReactNode) | undefined
  children: ReactNode
}) {
  const hrefOf = useItemHref(projectId)
  const linkTitleOf = useLinkTitleOf()

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        {entries.map((entry, index) => (
          <div key={entry.item.id} className="space-y-3">
            {index > 0 && <Separator />}
            <LinkedEntryBlock
              entry={entry}
              hrefOf={hrefOf}
              linkTitleOf={linkTitleOf}
              actions={renderActions?.(entry) ?? null}
            />
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}
