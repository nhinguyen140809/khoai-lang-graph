'use client'

import { cn } from 'cn'
import type * as React from 'react'

import { KeyText } from './key-text'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/** How the kind and the title of a record read beside each other. */
export type RecordNameLayout = 'line' | 'stacked'

interface RecordNameProps {
  /** The title of the kind of the record, such as "Invoice". */
  kind: string
  /** The title of the record. */
  title: string
  /** The key of the record, last, where it helps; none where the kind and the title say which record it is. */
  code?: string | undefined
  layout: RecordNameLayout
  className?: string | undefined
}

/**
 * How a record names itself: its kind and its title, with its key optional and always last. The
 * kind is small and muted; on one line the title is cut with an ellipsis when it does not fit,
 * stacked the kind sits over the title with the key at the end of its line.
 */
export function RecordName({ kind, title, code, layout, className }: RecordNameProps) {
  if (layout === 'stacked') {
    return (
      <span className={cn('min-w-0 space-y-0.5', className)}>
        <span className="block text-xs font-normal text-muted-foreground">{kind}</span>
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="min-w-0 truncate text-sm font-semibold">{title}</span>
          {code !== undefined && <KeyText className="shrink-0">{code}</KeyText>}
        </span>
      </span>
    )
  }
  return (
    <span className={cn('flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1', className)}>
      <span className="shrink-0 text-xs font-normal text-muted-foreground">{kind}</span>
      <span className="min-w-0 truncate">{title}</span>
      {code !== undefined && <KeyText className="shrink-0">{code}</KeyText>}
    </span>
  )
}

interface RecordNameTooltipProps {
  kind: string
  title: string
  code?: string | undefined
  /** The drawn title, often a link; the whole name shows in the tooltip. */
  children: React.ReactNode
}

/**
 * The whole name of a record over its drawn title: the kind, the title and, when it helps, the
 * key, for a row or a node that names the record by less than all of it.
 */
export function RecordNameTooltip({ kind, title, code, children }: RecordNameTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <span className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">{kind}</span>
          <span className="font-semibold">{title}</span>
          {code !== undefined && (
            <span>
              <KeyText>{code}</KeyText>
            </span>
          )}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}
