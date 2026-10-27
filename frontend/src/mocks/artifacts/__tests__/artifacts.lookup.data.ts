import type { Revision } from '@/modules/artifact/entities'

import { userOrigin } from '../origins.utils'

/** A record at version 3, with the content of its two earlier versions. */
export const artifactAtV3 = {
  version: 3,
  content: { title: 'third' },
  updated_by: userOrigin,
  updated_at: '2026-01-03T00:00:00Z',
}

export const revisions: Revision[] = [2, 1].map((version) => ({
  version,
  change_reason: 'rework',
  changed_by: userOrigin,
  created_at: `2026-01-0${String(version)}T00:00:00Z`,
  content: { title: version === 2 ? 'second' : 'first' },
}))

/** The version a request names, and the title of the record it reads, or null if it has none. */
export const atVersionCases = [
  { name: 'no version', version: null, title: 'third' },
  { name: 'the current version', version: 3, title: 'third' },
  { name: 'an earlier version', version: 1, title: 'first' },
  { name: 'a version that never existed', version: 9, title: null },
]
