import type { Wording } from '@/shared/lib/view'

import type { ExportStatus } from './exports.types'

/** The label of each export status in each view. */
export const exportStatusLabels = {
  pending: { developer: 'Pending', user: 'In progress' },
  ready: { developer: 'Ready', user: 'Ready' },
  failed: { developer: 'Failed', user: 'Failed' },
} as const satisfies Record<ExportStatus, Wording>

/** How many exports a page of the list holds; the next page loads on demand. */
export const exportsPageSize = 50
