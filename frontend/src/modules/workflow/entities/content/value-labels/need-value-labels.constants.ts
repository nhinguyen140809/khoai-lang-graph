import type { Wording } from '@/shared/lib/view'

/** How sure the analysis is of an unstated need, in each view. */
export const confidenceLabels = {
  low: { developer: 'Low', user: 'Low confidence' },
  medium: { developer: 'Medium', user: 'Medium confidence' },
  high: { developer: 'High', user: 'High confidence' },
} as const satisfies Record<string, Wording>

/** What became of an unstated need, in each view. */
export const dispositionLabels = {
  open: { developer: 'Open', user: 'Not decided' },
  promoted: { developer: 'Promoted', user: 'Added as a requirement' },
  dismissed: { developer: 'Dismissed', user: 'Not required' },
} as const satisfies Record<string, Wording>

/** Whether an assumption was checked, in each view. */
export const assumptionStatusLabels = {
  unverified: { developer: 'Unverified', user: 'Not verified' },
  confirmed: { developer: 'Confirmed', user: 'Confirmed' },
  invalidated: { developer: 'Invalidated', user: 'Found incorrect' },
} as const satisfies Record<string, Wording>
