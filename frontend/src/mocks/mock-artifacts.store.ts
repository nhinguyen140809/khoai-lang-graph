import type { Export, Revision } from '@/features/artifacts'

import { mockRecord } from './mock-db.utils'

// What the mock server changes about artifacts while the app runs: the items that the user edited
// and the exports that were asked for. The fixtures never change.

export interface ItemEdit {
  version: number
  content: Record<string, unknown>
  review_status?: string
  updated_at: string
  /** The versions that the user made, newest first. */
  history: Revision[]
}

export const itemEdits = mockRecord<Record<string, ItemEdit>>('item-edits', () => ({}))
/** The review status that an approval gave to artifacts, by artifact id. */
export const artifactStatuses = mockRecord<Record<string, string>>('artifact-statuses', () => ({}))
export const createdExports = mockRecord<Export[]>('created-exports', () => [])
