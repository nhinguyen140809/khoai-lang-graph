'use client'

import { cn } from 'cn'
import { ExternalLinkIcon } from 'lucide-react'
import type { Route } from 'next'

import { PageLink } from '@/shared/components/frame'

import { linkedItemMessages } from '../linked-items.constants'

interface LinkedItemCardProps {
  /** The page the card opens. */
  href: Route
  /** The smaller line over the title, such as the title of the kind of the item. */
  over: string
  /** The title of the record, the line the card is about. */
  title: string
  className?: string | undefined
}

/**
 * The card of a record the page relates to, in the outline look of the buttons of the design
 * system: the line over the title under its own title, with the sign of the page it opens at the
 * end, held in the middle of the height. The whole card opens the page, and the fill it takes on
 * hover says so.
 */
export function LinkedItemCard({ href, over, title, className }: LinkedItemCardProps) {
  return (
    <PageLink
      href={href}
      aria-label={linkedItemMessages.itemLabel(over, title)}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg border border-input px-3 py-2 text-left hover:bg-muted hover:no-underline',
        className,
      )}
    >
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="block text-xs font-normal text-muted-foreground">{over}</span>
        <span className="block text-sm font-semibold underline-offset-4 group-hover:underline">
          {title}
        </span>
      </span>
      <ExternalLinkIcon
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
      />
    </PageLink>
  )
}
