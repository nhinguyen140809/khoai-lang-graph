import type { Interrupt } from '@/modules/review/entities/@x/activity'
import type { WorkEntry } from '@/modules/run/entities/@x/activity'
import type { Message, Thread } from '@/modules/thread/entities/@x/activity'

/** What a line of work wrote of one kind of item. */
export interface KindGroup {
  kind: string
  /** The title of the kind, from its schema, as the documents name their groups. */
  title: string
  created: WorkEntry['created']
  changed: WorkEntry['changed']
}

/** One entry of the chat of a run: a message, a line of work, or a review. */
export type ActivityEntry =
  | { type: 'message'; id: string; time: string; message: Message }
  | {
      type: 'work'
      id: string
      time: string
      work: WorkEntry
      /** The title of its stage; null for a stage that the user does not see (developer view). */
      stageTitle: string | null
      /** The title of its subject, else its key; null without a subject. */
      subjectTitle: string | null
      kindGroups: KindGroup[]
    }
  | { type: 'review'; id: string; time: string; interrupt: Interrupt }

export type RunEntriesResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; entries: ActivityEntry[] }

export type ActivityThreadResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; thread: Thread | null }
