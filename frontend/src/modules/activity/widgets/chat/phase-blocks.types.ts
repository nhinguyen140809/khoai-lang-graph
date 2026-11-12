import type { ActivityEntry, PhaseItemEntry } from '@/modules/activity/entities'

/**
 * A part of the chat of a run: an entry on its own, or a phase with the items it holds. A phase
 * without its separator is the rest of one that a message cut in the middle.
 */
export type PhaseBlock =
  | { type: 'entry'; entry: ActivityEntry }
  | {
      type: 'phase'
      phaseId: string
      header: Extract<ActivityEntry, { type: 'phase' }> | null
      items: PhaseItemEntry[]
    }
