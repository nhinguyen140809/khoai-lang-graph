import type { Wording } from '@/shared/lib/view'

/** Where an ambiguity stands, in each view: whether what was unclear has been cleared up. */
export const ambiguityStatusLabels = {
  open: { developer: 'Not clarified' },
  resolved: { developer: 'Clarified' },
  dismissed: { developer: 'Not required' },
} as const satisfies Record<string, Wording>

/** Where a conflict stands, in each view: whether the disagreement has been decided. */
export const conflictStatusLabels = {
  open: { developer: 'Not decided' },
  resolved: { developer: 'Decided' },
  dismissed: { developer: 'Not required' },
} as const satisfies Record<string, Wording>

/** Where an issue of a validation report stands, in each view. */
export const validationIssueStatusLabels = {
  open: { developer: 'To be fixed' },
  fixed: { developer: 'Fixed' },
  dismissed: { developer: 'Not required' },
} as const satisfies Record<string, Wording>

/** The result of a validation report, in each view. */
export const validationResultLabels = {
  pass: { developer: 'Passed' },
  fail: { developer: 'Not passed' },
} as const satisfies Record<string, Wording>

/** How much a conflict or an issue weighs, in each view. */
export const severityLabels = {
  low: { developer: 'Minor' },
  medium: { developer: 'Moderate' },
  high: { developer: 'Serious' },
} as const satisfies Record<string, Wording>
