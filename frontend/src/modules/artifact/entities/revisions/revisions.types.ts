import { z } from 'zod'

import { contentValuesSchema } from '@/modules/workflow/entities/@x/artifact'

import { originSchema } from '../artifacts/artifacts.types'

// Temporary hand-written schemas for the revisions of artifacts and items.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

const changeReasons = [
  'generated',
  'user_edit',
  'rework',
  'reviewed',
  'restored',
  'deleted',
] as const

export type ChangeReason = (typeof changeReasons)[number]

/** One version of an artifact or of an item. */
export const revisionSchema = z.object({
  version: z.number().int(),
  change_reason: z.enum(changeReasons),
  changed_by: originSchema,
  created_at: z.iso.datetime(),
  /** The content at this version, to compare it with the next one. */
  content: contentValuesSchema,
})

export type Revision = z.infer<typeof revisionSchema>

/** A record whose versions are read or restored: an item or an artifact, by id. */
export interface RevisionTarget {
  type: 'item' | 'artifact'
  id: string
}

/** What `useRevisionHistory` gives: the versions of a record, or why they are not there. */
export type RevisionHistoryResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | {
      state: 'success'
      revisions: Revision[]
      hasMore: boolean
      isLoadingMore: boolean
      loadMore: () => Promise<void>
    }

/** How much of the history surface shows: the button, the selected version, or the list of every version above it. */
export type HistoryLevel = 'closed' | 'version' | 'list'

/** The state of the history of one record on its page, shared by the surface and the content. */
export interface HistoryView {
  level: HistoryLevel
  selectedVersion: number
  showsChanges: boolean
  open: () => void
  close: () => void
  toggleList: () => void
  stepBack: () => void
  select: (version: number) => void
  setShowsChanges: (shows: boolean) => void
}
