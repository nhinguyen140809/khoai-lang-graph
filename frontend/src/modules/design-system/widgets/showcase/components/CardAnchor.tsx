'use client'

import { cn } from 'cn'
import type { ReactNode } from 'react'

import type { CardSpan } from '../design-system.types'
import { useRowSpan } from '../hooks/useRowSpan'
import { useScrollIntoView } from '../hooks/useScrollIntoView'

// Written in full so that the styles are found; a card takes one column of a grid by default.
const spanClasses: Record<CardSpan, string> = {
  3: 'xl:col-span-3',
  4: 'xl:col-span-4',
  6: 'md:col-span-2 xl:col-span-6',
  8: 'md:col-span-2 xl:col-span-8',
  12: 'col-span-full',
}

/**
 * The cell of a card in the grid of its tab: it takes the columns of the card and the rows of its
 * height, and the search can scroll to it and mark it.
 */
export function CardAnchor({
  id,
  focused,
  span,
  children,
}: {
  id: string
  focused: boolean
  span: CardSpan
  children: ReactNode
}) {
  const ref = useScrollIntoView<HTMLDivElement>(focused)
  const { ref: contentRef, rows } = useRowSpan<HTMLDivElement>()
  return (
    <div
      ref={ref}
      id={id}
      style={rows === undefined ? undefined : { gridRowEnd: `span ${String(rows)}` }}
      className={cn('scroll-mt-4', spanClasses[span])}
    >
      {/* The content keeps its own height, and the cell around it takes the rows. */}
      <div
        ref={contentRef}
        data-focused={focused ? '' : undefined}
        className="rounded-xl transition-shadow data-focused:ring-2 data-focused:ring-ring"
      >
        {children}
      </div>
    </div>
  )
}
