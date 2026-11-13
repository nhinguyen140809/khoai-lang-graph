import type { Interrupt } from '@/modules/review/entities/@x/activity'
import type { StepNote, ToolUse, WorkEntry } from '@/modules/run/entities/@x/activity'
import type { Message, Thread } from '@/modules/thread/entities/@x/activity'

/** How a kind of item reads in the chat: its title, and whether its items can be opened one by one. */
export interface KindLook {
  title: string
  isNavigable: boolean
}

/** What a line of work wrote of one kind of item. */
export interface KindGroup {
  kind: string
  /** The title of the kind, from its schema, as the documents name their groups. */
  title: string
  /** Whether its items have a page and a row in the outline; those that do not are only counted. */
  isNavigable: boolean
  created: WorkEntry['created']
  changed: WorkEntry['changed']
}

/**
 * One entry of the chat of a run: a message, a review, the separator of a phase of work, or what
 * the phase shows under it. An item of a phase names it in `phaseId`, so that a closed phase can
 * leave its items out.
 */
export type ActivityEntry =
  | { type: 'message'; id: string; time: string; message: Message }
  | {
      type: 'phase'
      id: string
      time: string
      work: WorkEntry
      /** The title of its stage; null for a stage that the user does not see (developer view). */
      stageTitle: string | null
      /** The title of its subject, else its key; null without a subject. */
      subjectTitle: string | null
    }
  | {
      type: 'note'
      id: string
      time: string
      phaseId: string
      note: StepNote
      isInProgress: boolean
    }
  | { type: 'tool'; id: string; time: string; phaseId: string; use: ToolUse }
  | { type: 'written'; id: string; time: string; phaseId: string; kindGroups: KindGroup[] }
  | { type: 'failure'; id: string; time: string; phaseId: string; work: WorkEntry }
  | { type: 'review'; id: string; time: string; interrupt: Interrupt }

/** The entries that belong to a phase of work. */
export type PhaseItemEntry = Extract<ActivityEntry, { phaseId: string }>

export type RunEntriesResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; entries: ActivityEntry[] }

export type ActivityThreadResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; thread: Thread | null }
