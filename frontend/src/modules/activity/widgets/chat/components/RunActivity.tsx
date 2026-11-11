'use client'

import { ErrorBoundary } from 'react-error-boundary'

import { useRunEntries } from '@/modules/activity/entities'
import type { Run } from '@/modules/run/entities'
import type { Message, Thread } from '@/modules/thread/entities'
import { ErrorState, LoadingState } from '@/shared/components/state'
import { Marker } from '@/shared/components/ui/marker'
import { formatDateTime } from '@/shared/lib/time'
import { useView } from '@/shared/lib/view'

import { activityChatMessages } from '../activity-chat.constants'
import { usePhaseOpen } from '../hooks/usePhaseOpen'
import { EntryView } from './EntryView'
import { RunActivityProvider } from './RunActivityContext'

interface RunActivityProps {
  run: Run
  messages: readonly Message[]
  /** The thread the run belongs to, so an entry can act on it, such as sending a message again. */
  thread: Thread | null
  projectId: string
  isTarget: (entryId: string) => boolean
}

// What every entry of this run holds; the views below read it through the provider instead of a
// prop that each layer passes on.

/** One run in the chat: its separator, then each of its entries in the order of its time. */
export function RunActivity({ run, messages, thread, projectId, isTarget }: RunActivityProps) {
  const entries = useRunEntries(run, messages, projectId)
  const view = useView()
  const phases = usePhaseOpen()

  if (entries.state === 'pending') {
    return <LoadingState size="compact" rows={3} label={activityChatMessages.runLoading} />
  }
  if (entries.state === 'error') {
    return (
      <ErrorState
        size="compact"
        message={activityChatMessages.runError}
        onRetry={() => {
          entries.retry()
        }}
      />
    )
  }

  const first = entries.entries[0]
  const phaseWork = new Map(
    entries.entries.flatMap((entry) => (entry.type === 'phase' ? [[entry.id, entry.work]] : [])),
  )
  // The items of a phase that the reader has closed, or that is done, are left out.
  const shown = entries.entries.filter((entry) => {
    if (entry.type === 'review') return entry.interrupt.status !== 'pending'
    if (!('phaseId' in entry)) return true
    const work = phaseWork.get(entry.phaseId)
    return work === undefined || phases.isOpen(work)
  })
  return (
    <RunActivityProvider value={{ run, thread, projectId }}>
      <Marker variant="separator" className="mb-2 text-xs">
        {view === 'developer' ? `${activityChatMessages.run(run.number)} ` : ''}
        {first !== undefined ? formatDateTime(first.time) : null}
      </Marker>
      {/* A review that waits is not an entry of the chat: the page lays it over its end. */}
      {shown.map((entry) => (
        <ErrorBoundary
          key={entry.id}
          fallback={<p className="text-sm text-destructive">{activityChatMessages.entryError}</p>}
          resetKeys={[entry]}
        >
          <EntryView
            entry={entry}
            isTarget={isTarget(entry.id)}
            phase={
              entry.type === 'phase'
                ? {
                    isOpen: phases.isOpen(entry.work),
                    onToggle: () => {
                      phases.toggle(entry.work)
                    },
                  }
                : undefined
            }
          />
        </ErrorBoundary>
      ))}
    </RunActivityProvider>
  )
}
