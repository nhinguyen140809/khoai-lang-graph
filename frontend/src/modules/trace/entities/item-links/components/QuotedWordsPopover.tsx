'use client'

import { ChevronRightIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { useItemHref } from '@/modules/artifact/entities/@x/trace'
import {
  useContentSchemas,
  useItemTitleOf,
  useLinkTitleOf,
} from '@/modules/workflow/entities/@x/trace'
import { PageLink } from '@/shared/components/frame'
import { ColoredText } from '@/shared/components/ui/colored-text'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Separator } from '@/shared/components/ui/separator'

import type { LinkedEntry } from '../item-links.types'
import { linkedItemMessages } from '../linked-items.constants'
import { relationSentence } from './LinkedItemsPopover'
import { QuotedItemBody } from './QuotedItemBody'

/** One entry of the card: the card of the item with the words at its other end inside, and the
 * sentence of the link under it. */
function QuotedEntryBlock({
  entry,
  hrefOf,
  linkTitleOf,
}: {
  entry: LinkedEntry
  hrefOf: ReturnType<typeof useItemHref>
  /** The title of the type of a link, as the definition of the workflow names it. */
  linkTitleOf: (linkType: string) => string
}) {
  const schemas = useContentSchemas()
  const titleOf = useItemTitleOf()
  const schema = schemas.get(entry.item.kind)
  const kindTitle = schema?.title ?? entry.item.kind
  const title = titleOf(entry.item)

  return (
    <div className="space-y-1.5">
      {/* The card holds the words at the other end of the link, in the color of that end: the
          mark that opens it holds the words of this one. */}
      <PageLink
        href={hrefOf(entry.item)}
        aria-label={linkedItemMessages.itemLabel(kindTitle, title)}
        className="group flex w-full items-center gap-3 rounded-lg border border-input px-3 py-2 text-left hover:bg-muted hover:no-underline"
      >
        <span className="min-w-0 flex-1 space-y-1.5">
          <QuotedItemBody
            kind={kindTitle}
            item={{ key: entry.item.key, content: entry.item.content, schema }}
            quote={entry.otherQuote}
            color={entry.quoteColor}
            titleClassName="underline-offset-4 group-hover:underline"
          />
        </span>
        <ChevronRightIcon
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
        />
      </PageLink>
      <p className="text-xs">{relationSentence(entry.relation, title, linkTitleOf)}</p>
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
 * A card that opens on a click of a mark of the quoted words, with the items at the other end of
 * its links: each one a card of its own that holds the words the link quotes at its other end, in
 * the color of that end, and opens the page of the item.
 */
export function QuotedWordsPopover({
  projectId,
  entries,
  children,
}: {
  projectId: string
  entries: readonly LinkedEntry[]
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
            <QuotedEntryBlock entry={entry} hrefOf={hrefOf} linkTitleOf={linkTitleOf} />
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}
