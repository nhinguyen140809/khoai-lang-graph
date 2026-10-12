import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type RowTone = 'default' | 'success' | 'failure' | 'warning' | 'running'

const toneClasses = {
  default: 'text-muted-foreground',
  success: 'text-success-strong',
  failure: 'text-destructive-strong',
  warning: 'text-warning-strong',
  running: 'animate-pulse text-primary',
} as const satisfies Record<RowTone, string>

interface MarkProps {
  tone?: RowTone
}

/** The mark of a row that reports a state; its color is the state. */
export function StatusDot({ tone = 'default' }: MarkProps) {
  return <span aria-hidden className={cn('size-1.5 rounded-full bg-current', toneClasses[tone])} />
}

/** The mark of a row that holds what the user typed. */
export function PromptMark() {
  return <ChevronRight aria-hidden className="size-3.5 text-muted-foreground" />
}

interface EventRowProps {
  /** The mark before the row, a `StatusDot` or a `PromptMark`; a row under another has none. */
  mark?: ReactNode
  /** At the right of the row, such as the duration of a step. */
  trailing?: ReactNode
  /** The id of the row in the page, for the navigation to it. */
  id?: string
  className?: string
  children: ReactNode
}

/**
 * One row of the event log: a mark, what happened, and how long it took. Every row has the same
 * columns, so the marks line up and the text of the rows under a row starts at the same place.
 */
export function EventRow({ mark, trailing, id, className, children }: EventRowProps) {
  return (
    <div
      id={id}
      className={cn(
        'relative flex gap-x-2 font-mono text-xs leading-relaxed transition-colors data-[flash=true]:bg-accent',
        className,
      )}
    >
      <span className="flex h-lh w-4 shrink-0 items-center justify-center">{mark}</span>
      <div className="min-w-0 flex-1 break-words whitespace-pre-wrap">{children}</div>
      <span className="shrink-0 text-right text-muted-foreground">{trailing}</span>
    </div>
  )
}
