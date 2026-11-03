'use client'

import { ChevronRightIcon } from 'lucide-react'
import { type ReactNode, useCallback, useMemo } from 'react'

import { useItemHref } from '@/modules/artifact/entities/@x/trace'
import {
  contentSchemasByKind,
  itemTitle,
  useArtifactKinds,
  useWorkflowDefinition,
} from '@/modules/workflow/entities/@x/trace'
import { PageLink } from '@/shared/components/frame'
import { ColoredText } from '@/shared/components/ui/colored-text'
import { HighlightMark } from '@/shared/components/ui/highlight'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Separator } from '@/shared/components/ui/separator'

import type { LinkedEntry } from '../types/item-links.types'
import { linkedItemMessages } from './linked-items.constants'
import { relationSentence } from './LinkedItemsPopover'

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
  const { data: kinds } = useArtifactKinds()
  // The schemas are built once, for the kind title and the title.
  const schemas = useMemo(() => contentSchemasByKind(kinds), [kinds])
  const schema = schemas.get(entry.item.kind)
  const kindTitle = schema?.title ?? entry.item.kind
  const title = itemTitle(schema, entry.item)

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
          <span className="block text-xs font-normal text-muted-foreground">{kindTitle}</span>
          <span className="block text-sm font-semibold underline-offset-4 group-hover:underline">
            {title}
          </span>
          {entry.otherQuote !== null && (
            <span className="block text-sm">
              <HighlightMark variant="soft" color={entry.quoteColor}>
                {entry.otherQuote}
              </HighlightMark>
            </span>
          )}
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
  const { data: definition } = useWorkflowDefinition()
  const linkTitles = useMemo(
    () => new Map((definition?.link_types ?? []).map(({ key, title }) => [key, title])),
    [definition],
  )
  const linkTitleOf = useCallback(
    (linkType: string) => linkTitles.get(linkType) ?? linkType,
    [linkTitles],
  )

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
