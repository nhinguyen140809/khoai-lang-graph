'use client'

import { useRunEntries } from '@/modules/activity/entities'
import type { Run } from '@/modules/run/entities'
import type { Message, Thread } from '@/modules/thread/entities'
import { ErrorState, LoadingState } from '@/shared/components/state'
import { Marker } from '@/shared/components/ui/marker'
import { formatDateTime } from '@/shared/lib/time'
import { useView } from '@/shared/lib/view'

import { activityChatMessages } from '../activity-chat.constants'
import { usePhaseOpen } from '../hooks/usePhaseOpen'
import { phaseBlocks } from '../phase-blocks.utils'
import { ChatEntry } from './ChatEntry'
import { PhaseBlockView } from './PhaseBlockView'
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
  // A review that waits is not an entry of the chat: the page lays it over its end.
  const blocks = phaseBlocks(
    entries.entries.filter(
      (entry) => entry.type !== 'review' || entry.interrupt.status !== 'pending',
    ),
  )
  return (
    <RunActivityProvider value={{ run, thread, projectId }}>
      <Marker variant="separator" className="mb-2 text-xs">
        {view === 'developer' ? `${activityChatMessages.run(run.number)} ` : ''}
        {first !== undefined ? formatDateTime(first.time) : null}
      </Marker>
      {blocks.map((block) => {
        if (block.type === 'entry') {
          return (
            <ChatEntry
              key={block.entry.id}
              entry={block.entry}
              isTarget={isTarget(block.entry.id)}
            />
          )
        }
        const work = phaseWork.get(block.phaseId)
        if (work === undefined) return null
        return (
          <PhaseBlockView
            key={block.header?.id ?? block.items[0]?.id}
            block={block}
            isTarget={isTarget}
            phase={{
              isOpen: phases.isOpen(work),
              onToggle: () => {
                phases.toggle(work)
              },
            }}
          />
        )
      })}
    </RunActivityProvider>
  )
}
