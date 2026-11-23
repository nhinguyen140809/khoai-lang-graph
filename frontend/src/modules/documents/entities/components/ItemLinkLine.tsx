'use client'

import { TriangleAlertIcon } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import type { ItemLinksResult, TraceLink } from '@/modules/trace/entities/@x/documents'
import {
  linkedItemMessages,
  LinkedItemsPopover,
  quoteMarkColors,
} from '@/modules/trace/entities/@x/documents'
import { Button } from '@/shared/components/ui/button'

import { itemLinkMessages, linkChipsShown } from '../constants/documents.constants'

interface ItemLinkLineProps {
  projectId: string
  /** The links of the item, from `useItemLinks`. */
  links: ItemLinksResult
  /** What the card of an outgoing chip offers besides its sentence, such as removing the link; none when the link line only reads. */
  renderMenu?: ((link: TraceLink) => ReactNode) | undefined
}

/**
 * The link line under the key line of an item: every direct link of the item in the short words of
 * its group, the outgoing ones under the title of their link type, the incoming ones under it and
 * "this item". A chip opens the card of the items at the other end, which says the sentence of the
 * link. Five chips of a group show, "N more" the rest.
 */
export function ItemLinkLine({ projectId, links, renderMenu }: ItemLinkLineProps) {
  const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<string>>(new Set())
  const isExpanded = (group: string) => expandedGroups.has(group)

  if (links.state !== 'success' || links.count === 0) return null

  const group = (
    { linkType, title, rows }: (typeof links.outgoing)[number],
    isOutgoing: boolean,
  ) => {
    const shown = isExpanded(linkType) ? rows : rows.slice(0, linkChipsShown)
    const hidden = rows.length - shown.length
    const chips = shown.map((row) => (
      <LinkedItemsPopover
        key={row.link.id}
        projectId={projectId}
        entries={[
          {
            item: row.other,
            relation: { direction: isOutgoing ? 'outgoing' : 'incoming', linkType },
            isOutOfDate: row.isOutOfDate,
            otherQuote: isOutgoing ? row.link.target_quote : row.link.source_quote,
            quoteColor: quoteMarkColors[isOutgoing ? 'target' : 'source'],
            madeFromVersion: row.isOutOfDate ? row.link.target_version : null,
          },
        ]}
        renderMenu={isOutgoing && renderMenu !== undefined ? () => renderMenu(row.link) : undefined}
      >
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="bg-primary/10"
          aria-label={
            row.isOutOfDate
              ? linkedItemMessages.chipLabelOutOfDate(row.kindTitle, row.title)
              : linkedItemMessages.itemLabel(row.kindTitle, row.title)
          }
        >
          {row.isOutOfDate && (
            <TriangleAlertIcon aria-hidden className="size-3 shrink-0 text-warning-strong" />
          )}
          <span className="shrink-0 text-muted-foreground">{row.kindTitle}</span>
          <span className="max-w-64 truncate">{row.title}</span>
        </Button>
      </LinkedItemsPopover>
    ))
    if (hidden > 0) {
      chips.push(
        <Button
          key="more"
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => {
            setExpandedGroups((current) => new Set(current).add(linkType))
          }}
        >
          {itemLinkMessages.moreLinks(hidden)}
        </Button>,
      )
    }
    return (
      <div key={linkType} className="flex flex-wrap items-center gap-1">
        <span className="text-xs text-muted-foreground">
          {isOutgoing ? title : linkedItemMessages.incoming(title)}
        </span>
        {chips}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {links.outgoing.map((outgoing) => group(outgoing, true))}
      {links.incoming.map((incoming) => group(incoming, false))}
    </div>
  )
}
