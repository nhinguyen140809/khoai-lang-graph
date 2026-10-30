import type { Wording } from '@/shared/lib/view'

import type { ReviewStatus } from '../types/artifacts.types'

/** The label of each review status in each view, as the row of an item or an artifact reads it. */
export const reviewStatusLabels = {
  draft: { developer: 'Draft', user: 'Needs review' },
  approved: { developer: 'Approved', user: 'Approved' },
  rejected: { developer: 'Rejected', user: 'Rejected' },
  superseded: { developer: 'Superseded', user: 'Replaced' },
} as const satisfies Record<ReviewStatus, Wording>
