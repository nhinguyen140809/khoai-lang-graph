import type { Wording } from '@/shared/lib/view'

import type { ReviewStatus } from './artifacts.types'

/** The label of each review status in each view, as the row of an item or an artifact reads it. */
export const reviewStatusLabels = {
  draft: { developer: 'Needs review' },
  approved: { developer: 'Approved' },
  rejected: { developer: 'Rejected' },
  superseded: { developer: 'Replaced' },
} as const satisfies Record<ReviewStatus, Wording>

/** A project holds a few artifacts, one for each kind and each persona: the list reads every page, usually one. */
export const artifactsPageSize = 200
