import type { Tone } from '@/shared/lib/tone'
import type { Wording } from '@/shared/lib/view'

import { reviewStatusLabels } from '../artifacts/artifacts.constants'
import type { AttentionLevel, ItemStatus } from './item-status.types'

/** The words for the states of an item that ask something of the user. */
export const itemStatusMessages = {
  statuses: {
    edited: { letter: 'E', label: 'Edited by you, not reviewed yet' },
    openIssue: { letter: '?', label: 'Issue to resolve' },
    outOfDate: { letter: '!', label: 'Based on an older version' },
    rejected: { letter: 'X', label: 'Rejected' },
    draftInReview: { letter: null, label: 'Needs your review' },
  },
  attention: {
    draft: (count: number) => `${String(count)} to review`,
    openIssue: (count: number) => `${String(count)} to resolve`,
    edited: (count: number) => `${String(count)} edited`,
    outOfDate: (count: number) => `${String(count)} out of date`,
  },
} as const

/**
 * The levels of attention in order, from the one that asks most. `color` is the color of a row of
 * the level: `muted` for a row that is set aside, and `null` leaves the text color alone.
 */
export const attentionLevels = {
  act: { order: 0, color: 'warning' },
  follow: { order: 1, color: 'primary' },
  none: { order: 2, color: null },
  quiet: { order: 3, color: 'muted' },
} as const satisfies Record<AttentionLevel, { order: number; color: Tone | null }>

/** The letter and the label of each item status; a status with no letter shows by its color alone. */
export const itemStatusLooks = {
  draft: { letter: null, label: reviewStatusLabels.draft },
  approved: { letter: null, label: reviewStatusLabels.approved },
  rejected: {
    letter: itemStatusMessages.statuses.rejected.letter,
    label: reviewStatusLabels.rejected,
  },
  edited: {
    letter: itemStatusMessages.statuses.edited.letter,
    label: {
      developer: itemStatusMessages.statuses.edited.label,
      user: itemStatusMessages.statuses.edited.label,
    },
  },
  openIssue: {
    letter: itemStatusMessages.statuses.openIssue.letter,
    label: {
      developer: itemStatusMessages.statuses.openIssue.label,
      user: itemStatusMessages.statuses.openIssue.label,
    },
  },
  outOfDate: {
    letter: itemStatusMessages.statuses.outOfDate.letter,
    label: {
      developer: itemStatusMessages.statuses.outOfDate.label,
      user: itemStatusMessages.statuses.outOfDate.label,
    },
  },
} as const satisfies Record<ItemStatus, { letter: string | null; label: Wording }>
