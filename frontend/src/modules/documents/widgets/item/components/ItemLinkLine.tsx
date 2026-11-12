'use client'

import { TriangleAlertIcon } from 'lucide-react'
import { useState } from 'react'

import type { ItemLinksResult, TraceLink } from '@/modules/trace/entities'
import { linkedItemMessages, LinkedItemsPopover, quoteMarkColors } from '@/modules/trace/entities'
import { useUnlinkAction } from '@/modules/trace/features/remove-link'
import { Button } from '@/shared/components/ui/button'
import { DropdownActionItem } from '@/shared/components/ui/menu-action'

import { itemPageMessages, linkChipsShown } from '../item-page.constants'

interface ItemLinkLineProps {
  projectId: string
  /** The links of the item, from `useItemLinks`. */
  links: ItemLinksResult
  /** Why the document of the item cannot change, which a change of a link needs; null when it can. */
  lockedReason: string | null
  /** The link whose chips and marks show active, held by the page. */
  activeLinkId: string | null
  onActiveLinkChange: (linkId: string | null) => void
}

/** What the menu of the card of an outgoing chip offers: removing the link, when its document may change. */
function RemoveLinkMenuItem({
  link,
  lockedReason,
}: {
  link: Pick<TraceLink, 'id' | 'source_item_id'>
  lockedReason: string | null
}) {
  const remove = useUnlinkAction(link, lockedReason)

  return (
    <DropdownActionItem
      icon={remove.icon}
      label={remove.label}
      disabledReason={remove.disabledReason}
      tone={remove.tone}
      onSelect={remove.run}
    />
  )
}

/**
 * The link line under the key line of an item: every direct link of the item in the short words of
 * its group, the outgoing ones under the title of their link type, the incoming ones under it and
 * "this item". A chip opens the card of the items at the other end, which says the sentence of the
 * link. Five chips of a group show, "N more" the rest.
 */
export function ItemLinkLine({
  projectId,
  links,
  lockedReason,
  activeLinkId,
  onActiveLinkChange,
}: ItemLinkLineProps) {
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
        renderMenu={
          isOutgoing
            ? () => <RemoveLinkMenuItem link={row.link} lockedReason={lockedReason} />
            : undefined
        }
      >
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className={
            activeLinkId === row.link.id ? 'bg-primary/10 ring-2 ring-ring/50' : 'bg-primary/10'
          }
          aria-label={
            row.isOutOfDate
              ? linkedItemMessages.chipLabelOutOfDate(row.kindTitle, row.title)
              : linkedItemMessages.itemLabel(row.kindTitle, row.title)
          }
          onMouseEnter={() => {
            onActiveLinkChange(row.link.id)
          }}
          onFocus={() => {
            onActiveLinkChange(row.link.id)
          }}
          onMouseLeave={() => {
            onActiveLinkChange(null)
          }}
          onBlur={() => {
            onActiveLinkChange(null)
          }}
        >
          {row.isOutOfDate && (
            <TriangleAlertIcon aria-hidden className="size-3 shrink-0 text-warning-strong" />
          )}
          <span className="shrink-0 text-muted-foreground">{row.kindTitle}</span>
          <span className="whitespace-normal">{row.title}</span>
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
          {itemPageMessages.moreLinks(hidden)}
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
