import type { Wording } from '@/shared/lib/view'

import type { ExportStatus } from '../types/exports.types'

/** The label of each export status in each view. */
export const exportStatusLabels = {
  pending: { developer: 'Pending', user: 'In progress' },
  ready: { developer: 'Ready', user: 'Ready' },
  failed: { developer: 'Failed', user: 'Failed' },
} as const satisfies Record<ExportStatus, Wording>
