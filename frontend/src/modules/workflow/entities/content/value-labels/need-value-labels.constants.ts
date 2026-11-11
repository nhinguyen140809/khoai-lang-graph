import type { Wording } from '@/shared/lib/view'

/** How sure the analysis is of an unstated need, in each view. */
export const confidenceLabels = {
  low: { developer: 'Low confidence' },
  medium: { developer: 'Medium confidence' },
  high: { developer: 'High confidence' },
} as const satisfies Record<string, Wording>

/** What became of an unstated need, in each view. */
export const dispositionLabels = {
  open: { developer: 'Not decided' },
  promoted: { developer: 'Added as a requirement' },
  dismissed: { developer: 'Not required' },
} as const satisfies Record<string, Wording>

/** Whether an assumption was checked, in each view. */
export const assumptionStatusLabels = {
  unverified: { developer: 'Not verified' },
  confirmed: { developer: 'Confirmed' },
  invalidated: { developer: 'Found incorrect' },
} as const satisfies Record<string, Wording>
