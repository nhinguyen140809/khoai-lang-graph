import type { WorkflowStep } from './workflow.types'

export type StepEntry =
  | { type: 'step'; step: WorkflowStep }
  /** Consecutive steps on one subject, such as the turns of one interview. */
  | { type: 'group'; steps: WorkflowStep[]; key: string }

/** The key of the item that the steps are about, from the keys of what they produced. */
function subjectKey(steps: WorkflowStep[]): string {
  const key = steps.flatMap(({ produced }) => produced).at(0)?.key
  return key === undefined ? (steps[0]?.stage ?? '') : (key.split('#')[0] ?? key)
}

/** The steps of a run as entries: steps with the same subject and stage next to each other join. */
export function groupSteps(steps: WorkflowStep[]): StepEntry[] {
  const ordered = steps.toSorted((a, b) => a.sequence - b.sequence)
  const entries: StepEntry[] = []
  for (const step of ordered) {
    const last = entries.at(-1)
    const previous = last?.type === 'group' ? last.steps.at(-1) : last?.step
    const joins =
      step.subject_item_id !== null &&
      previous?.subject_item_id === step.subject_item_id &&
      previous.stage === step.stage
    if (joins && last !== undefined) {
      const steps = last.type === 'group' ? [...last.steps, step] : [last.step, step]
      entries[entries.length - 1] = { type: 'group', steps, key: subjectKey(steps) }
    } else {
      entries.push({ type: 'step', step })
    }
  }
  return entries
}
