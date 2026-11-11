import type { View } from '@/shared/lib/view'

import type { PhaseItem, WorkEntry } from './work.types'
import { groupNotes, visibleNotes } from './work-notes.utils'
import { isWorkStatusInProgress } from './work-status-look.utils'

/**
 * What a phase shows under its separator, in the order written: its notes, and each run of uses of
 * one tool as one item. While the phase works, its last item is in progress: a note that says what
 * it is doing, or a tool that is in use.
 */
export function phaseItems(work: WorkEntry, view: View): PhaseItem[] {
  const groups = groupNotes(visibleNotes(work.notes, view))
  // A part that an earlier cut left holds no step and is over.
  const isWorking = work.steps.length > 0 && isWorkStatusInProgress(work.status)
  return groups.map((group, index): PhaseItem => {
    const isLast = index === groups.length - 1
    if (group.type === 'tool') {
      return {
        type: 'tool',
        use: {
          id: `${work.id}~${String(index)}`,
          tool: group.tool,
          notes: group.notes,
          startedAt: group.notes[0]?.created_at ?? work.startedAt,
          isRunning: isWorking && isLast,
        },
      }
    }
    return {
      type: 'note',
      note: group.note,
      isInProgress: isWorking && isLast && group.note.kind === 'doing',
    }
  })
}

/** Whether a phase shows its items when the reader has not opened or closed it: until it is done. */
export function isPhaseOpenByDefault(work: Pick<WorkEntry, 'status'>): boolean {
  return work.status !== 'done'
}
