import type { Wording } from '@/shared/lib/view'

/** What a requirement is about, in each view. */
export const requirementTypeLabels = {
  functional: { developer: 'Functional' },
  non_functional: { developer: 'Quality' },
  constraint: { developer: 'Constraint' },
} as const satisfies Record<string, Wording>

/** How a requirement is checked, in each view. */
export const verificationMethodLabels = {
  test: { developer: 'Testing' },
  inspection: { developer: 'Inspection' },
  demonstration: { developer: 'Demonstration' },
  analysis: { developer: 'Analysis' },
} as const satisfies Record<string, Wording>

/** The size of a backlog item, in each view. */
export const backlogItemTypeLabels = {
  epic: { developer: 'Large goal' },
  user_story: { developer: 'User story' },
} as const satisfies Record<string, Wording>

/** How far a backlog item is delivered, in each view. */
export const deliveryStatusLabels = {
  todo: { developer: 'Not started' },
  in_progress: { developer: 'In progress' },
  done: { developer: 'Completed' },
} as const satisfies Record<string, Wording>
