'use client'

import type { Route } from 'next'

import { PageLink } from '@/shared/components/frame'
import { Item, ItemContent } from '@/shared/components/ui/item'

import type { LinkQuote } from '../../chains/chains.types'
import type { QuotedItem } from '../item-links.types'
import { quoteMarkColors } from '../link-marks.constants'
import { QuotedItemBody } from './QuotedItemBody'

interface QuotedItemCardProps {
  /** The page of the item, which the title opens. */
  href: Route
  /** The title of the kind of the item. */
  kind: string
  /** The item, with the schema of its kind, which says where its words are. */
  item: QuotedItem
  /** The words of the item that a link quotes; none when the link quotes no words of it. */
  quote: string | null
  /** Which end of the link the item is, which sets the color of the words. */
  side: LinkQuote['side']
  className?: string | undefined
}

/**
 * An item that a link quotes, as the muted `Item` of the design system holding a `QuotedItemBody`:
 * the kind, the title as the link to the page of the item, and the words the link quotes where the
 * item holds them.
 */
export function QuotedItemCard({ href, kind, item, quote, side, className }: QuotedItemCardProps) {
  return (
    <Item variant="muted" size="sm" className={className}>
      <ItemContent>
        <QuotedItemBody
          kind={kind}
          item={item}
          quote={quote}
          color={quoteMarkColors[side]}
          wrapTitle={(title) => (
            <PageLink href={href} className="no-underline hover:underline">
              {title}
            </PageLink>
          )}
        />
      </ItemContent>
    </Item>
  )
}
