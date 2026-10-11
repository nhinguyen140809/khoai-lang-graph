import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type RowTone = 'default' | 'success' | 'failure' | 'warning'

const toneClasses = {
  default: '',
  success: 'text-success-strong',
  failure: 'text-destructive-strong',
  warning: 'text-warning-strong',
} as const satisfies Record<RowTone, string>

interface EventRowProps {
  /** The time of the event as `hh:mm:ss`; empty when the event has none of its own. */
  time?: string
  /** What kind of event it is, in a few letters: `input`, `run`, `step`. */
  kind: string
  tone?: RowTone
  /** At the right of the row, such as the duration of a step. */
  trailing?: ReactNode
  /** A row under another row of the same event keeps the columns but names no kind. */
  continued?: boolean
  /** The id of the row in the page, for the navigation to it. */
  id?: string
  children: ReactNode
}

/**
 * One row of the event log. Every row has the same columns, so the log reads as a table of
 * events: time, kind, what happened, and how long it took.
 */
export function EventRow({
  time = '',
  kind,
  tone = 'default',
  trailing,
  continued = false,
  id,
  children,
}: EventRowProps) {
  return (
    <div
      id={id}
      className={cn(
        'grid grid-cols-[4.5rem_4.5rem_minmax(0,1fr)_auto] gap-x-3 font-mono text-xs leading-relaxed transition-colors data-[flash=true]:bg-accent',
        toneClasses[tone],
      )}
    >
      <span className="text-muted-foreground">{time}</span>
      <span className={cn('text-muted-foreground', tone !== 'default' && 'text-current')}>
        {continued ? '' : kind}
      </span>
      <div className="min-w-0 break-words whitespace-pre-wrap">{children}</div>
      <span className="text-right text-muted-foreground">{trailing}</span>
    </div>
  )
}
