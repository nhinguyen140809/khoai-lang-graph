import type { Wording } from '@/shared/lib/view'

/** What a requirement is about, in each view. */
export const requirementTypeLabels = {
  functional: { developer: 'Functional', user: 'Functional' },
  non_functional: { developer: 'Non-functional', user: 'Quality' },
  constraint: { developer: 'Constraint', user: 'Constraint' },
} as const satisfies Record<string, Wording>

/** How a requirement is checked, in each view. */
export const verificationMethodLabels = {
  test: { developer: 'Test', user: 'Testing' },
  inspection: { developer: 'Inspection', user: 'Inspection' },
  demonstration: { developer: 'Demonstration', user: 'Demonstration' },
  analysis: { developer: 'Analysis', user: 'Analysis' },
} as const satisfies Record<string, Wording>

/** The size of a backlog item, in each view. */
export const backlogItemTypeLabels = {
  epic: { developer: 'Epic', user: 'Large goal' },
  user_story: { developer: 'User story', user: 'User story' },
} as const satisfies Record<string, Wording>

/** How far a backlog item is delivered, in each view. */
export const deliveryStatusLabels = {
  todo: { developer: 'To do', user: 'Not started' },
  in_progress: { developer: 'In progress', user: 'In progress' },
  done: { developer: 'Done', user: 'Completed' },
} as const satisfies Record<string, Wording>
