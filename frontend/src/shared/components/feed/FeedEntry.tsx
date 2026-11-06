'use client'

import { cn } from 'cn'
import type { ReactNode } from 'react'

import { type Tone, toneClasses } from '@/shared/lib/tone'

interface FeedEntryProps {
  /** The id of the element, which the address of a page can name to scroll to it. */
  anchorId: string
  /** The small mark at the start of the entry, such as the icon of its status. */
  mark: ReactNode
  /** The color of the mark; the color of the text around it without one. */
  markColor?: Tone | undefined
  /** The name of where the entry comes from, read by assistive technology only. */
  label: string
  /** Whether the entry carries a fill of its own, as the entries of the user do. */
  isFilled?: boolean | undefined
  /** Whether the address of the page names this entry: it takes the focus and a ring. */
  isTarget?: boolean | undefined
  /** Buttons under the entry, shown on hover and focus, always on a touch screen. */
  actions?: ReactNode
  children: ReactNode
}

/**
 * An entry of a feed: full width, a small mark at its start, a fill of its own for what the user
 * wrote, and actions under it that show on hover and focus. The address can name it: it takes the
 * focus and a ring.
 */
export function FeedEntry({
  anchorId,
  mark,
  markColor,
  label,
  isFilled = false,
  isTarget = false,
  actions,
  children,
}: FeedEntryProps) {
  return (
    <div
      id={anchorId}
      tabIndex={isTarget ? -1 : undefined}
      {...(isFilled ? { 'data-filled': true } : {})}
      {...(isTarget ? { 'data-target': true } : {})}
      className={cn(
        'group/entry flex gap-3 rounded-lg px-3 py-2 data-[filled]:bg-muted',
        'data-[target]:ring-2 data-[target]:ring-ring/50',
        markColor && toneClasses[markColor],
      )}
    >
      <span
        aria-hidden
        className="flex h-6 w-4 shrink-0 items-center justify-center text-muted-foreground data-[mark-color]:text-(--tone-strong) [&_svg]:size-4"
        data-mark-color={markColor ?? null}
      >
        {mark}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm leading-6">
        <span className="sr-only">{label}:</span>
        {children}
        {actions !== undefined && (
          <div className="-ml-1.5 flex items-center gap-0.5 opacity-0 group-hover/entry:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
