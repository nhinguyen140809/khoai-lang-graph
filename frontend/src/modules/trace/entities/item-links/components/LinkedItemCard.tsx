'use client'

import { cn } from 'cn'
import { ExternalLinkIcon } from 'lucide-react'
import type { Route } from 'next'

import { PageLink } from '@/shared/components/frame'
import { RecordName } from '@/shared/components/ui/record-name'

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
 * system: the kind of the record over its title, with the sign of the page it opens at the end,
 * held in the middle of the height. The whole card opens the page, and the fill it takes on
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
      <RecordName kind={over} title={title} layout="stacked" className="flex-1" />
      <ExternalLinkIcon
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
      />
    </PageLink>
  )
}
