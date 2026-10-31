import type { Wording } from '@/shared/lib/view'

import type { ChangeReason } from '../types/revisions.types'

/**
 * The label of each change reason in each view: why one version of an artifact or an item
 * exists, as the history of a record reads it.
 */
export const changeReasonLabels = {
  generated: { developer: 'Generated', user: 'Written by the agents' },
  user_edit: { developer: 'User edit', user: 'Your edit' },
  rework: { developer: 'Rework', user: 'Reworked' },
  reviewed: { developer: 'Reviewed', user: 'Approved in a review' },
  restored: { developer: 'Restored', user: 'Restored' },
  deleted: { developer: 'Deleted', user: 'Deleted' },
} as const satisfies Record<ChangeReason, Wording>
