import type { Wording } from '@/shared/lib/view'

/** Where an ambiguity stands, in each view: whether what was unclear has been cleared up. */
export const ambiguityStatusLabels = {
  open: { developer: 'Open', user: 'Not clarified' },
  resolved: { developer: 'Resolved', user: 'Clarified' },
  dismissed: { developer: 'Dismissed', user: 'Not required' },
} as const satisfies Record<string, Wording>

/** Where a conflict stands, in each view: whether the disagreement has been decided. */
export const conflictStatusLabels = {
  open: { developer: 'Open', user: 'Not decided' },
  resolved: { developer: 'Resolved', user: 'Decided' },
  dismissed: { developer: 'Dismissed', user: 'Not required' },
} as const satisfies Record<string, Wording>

/** Where an issue of a validation report stands, in each view. */
export const validationIssueStatusLabels = {
  open: { developer: 'Open', user: 'To be fixed' },
  fixed: { developer: 'Fixed', user: 'Fixed' },
  dismissed: { developer: 'Dismissed', user: 'Not required' },
} as const satisfies Record<string, Wording>

/** The result of a validation report, in each view. */
export const validationResultLabels = {
  pass: { developer: 'Pass', user: 'Passed' },
  fail: { developer: 'Fail', user: 'Not passed' },
} as const satisfies Record<string, Wording>

/** How much a conflict or an issue weighs, in each view. */
export const severityLabels = {
  low: { developer: 'Low', user: 'Minor' },
  medium: { developer: 'Medium', user: 'Moderate' },
  high: { developer: 'High', user: 'Serious' },
} as const satisfies Record<string, Wording>
