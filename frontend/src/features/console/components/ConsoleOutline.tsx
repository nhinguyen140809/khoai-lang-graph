'use client'

import { ErrorState, LoadingState } from '@/shared/components/state'
import { EmptyState } from '@/shared/components/state'

import { formatClock } from '../event-log.utils'
import { scrollToEvent } from '../event-scroll.utils'
import { useEventLog } from '../hooks/useEventLog'

interface ConsoleOutlineProps {
  threadId: string
}

/**
 * Every time the user typed a message or ran a command in the console, oldest first. Choosing one
 * scrolls the event log to it.
 */
export function ConsoleOutline({ threadId }: ConsoleOutlineProps) {
  const eventLog = useEventLog(threadId)

  if (eventLog.isPending) {
    return <LoadingState label="Loading the outline" rows={3} size="compact" className="px-3" />
  }
  if (eventLog.error !== null) {
    return (
      <ErrorState
        message={eventLog.error.message}
        onRetry={eventLog.refetch}
        size="compact"
        className="px-3"
      />
    )
  }

  const inputs = eventLog.log.flatMap((event) =>
    event.kind === 'input'
      ? [{ id: event.id, time: event.time, kind: 'input', text: event.text }]
      : event.kind === 'command'
        ? [{ id: event.id, time: event.time, kind: 'command', text: `/${event.name}` }]
        : [],
  )

  if (inputs.length === 0) {
    return <EmptyState title="Nothing typed yet" size="compact" className="px-3" />
  }

  return (
    <ol aria-label="Inputs of the console" className="flex flex-col gap-px px-1 pb-2">
      {inputs.map((input) => (
        <li key={input.id}>
          <button
            type="button"
            onClick={() => {
              scrollToEvent(input.id)
            }}
            className="group/entry flex w-full items-baseline gap-2 rounded-md px-2 py-1.5 text-left font-mono text-xs outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="min-w-0 flex-1 truncate text-foreground">{input.text}</span>
            {/* The time shows on hover or focus, so the text keeps the width of the panel. */}
            <span className="hidden shrink-0 text-muted-foreground group-hover/entry:inline group-focus-visible/entry:inline">
              {formatClock(input.time)}
            </span>
          </button>
        </li>
      ))}
    </ol>
  )
}
