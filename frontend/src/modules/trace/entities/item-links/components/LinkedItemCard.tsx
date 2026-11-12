'use client'

import { cn } from 'cn'
import { ExternalLinkIcon, MoreVerticalIcon } from 'lucide-react'
import type { Route } from 'next'
import type { ReactNode } from 'react'

import { PageLink } from '@/shared/components/frame'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { RecordName } from '@/shared/components/ui/record-name'

import { linkedItemMessages } from '../linked-items.constants'

interface LinkedItemCardProps {
  /** The page the card opens. */
  href: Route
  /** The smaller line over the title, such as the title of the kind of the item. */
  over: string
  /** The title of the record, the line the card is about. */
  title: string
  /** What the card says in place of the kind over the title, such as the title with quoted words marked. */
  body?: ReactNode | undefined
  /** The entries of the menu at the end of the card, such as removing the link; no menu without them. */
  menu?: ReactNode | undefined
  className?: string | undefined
}

/**
 * The card of a record the page relates to, in the outline look of the buttons of the design
 * system: the kind of the record over its title, and at the end the sign of the page it opens, or
 * the menu of what the caller offers to do with the link, held in the middle of the height. The
 * whole card opens the page, and the fill it takes on hover says so; the menu is a button of its
 * own over the end of the card, not part of what the card opens.
 */
export function LinkedItemCard({ href, over, title, body, menu, className }: LinkedItemCardProps) {
  const hasMenu = menu !== undefined && menu !== null

  return (
    <div className="relative w-full">
      <PageLink
        href={href}
        aria-label={linkedItemMessages.itemLabel(over, title)}
        className={cn(
          'group flex min-w-0 items-center gap-3 rounded-lg border border-input px-3 py-2 text-left hover:bg-muted hover:no-underline',
          hasMenu && 'pr-11',
          className,
        )}
      >
        {body === undefined ? (
          <RecordName kind={over} title={title} layout="stacked" className="flex-1" />
        ) : (
          <span className="min-w-0 flex-1 space-y-1">{body}</span>
        )}
        {!hasMenu && (
          <ExternalLinkIcon
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
          />
        )}
      </PageLink>
      {hasMenu && (
        <div className="absolute inset-y-0 right-1.5 flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground"
              >
                <MoreVerticalIcon aria-hidden />
                <span className="sr-only">{linkedItemMessages.moreActions}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {menu}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
