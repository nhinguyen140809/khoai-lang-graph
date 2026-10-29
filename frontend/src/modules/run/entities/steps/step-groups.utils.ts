import { subjectKeyOfMessage } from '@/modules/artifact/entities/@x/run'

import type { RunStep, StepEntry } from './run-steps.types'
import { orderedSteps } from './run-steps.utils'

/** The key of the item that the steps are about, from the keys of what they produced. */
function subjectKeyOf(steps: RunStep[]): string {
  const producedKey = steps.flatMap(({ produced }) => produced).at(0)?.key
  if (producedKey !== undefined) return subjectKeyOfMessage(producedKey)
  return steps[0]?.stage ?? ''
}

/** The steps of a run as entries: steps with the same subject and stage next to each other join. */
export function groupSteps(steps: RunStep[]): StepEntry[] {
  const ordered = orderedSteps(steps)
  const entries: StepEntry[] = []
  for (const step of ordered) {
    const last = entries.at(-1)
    const previous = last?.type === 'group' ? last.steps.at(-1) : last?.step
    const isSameSubject =
      step.subject_item_id !== null &&
      previous?.subject_item_id === step.subject_item_id &&
      previous.stage === step.stage
    if (isSameSubject && last !== undefined) {
      const joined = last.type === 'group' ? [...last.steps, step] : [last.step, step]
      entries[entries.length - 1] = { type: 'group', steps: joined, key: subjectKeyOf(joined) }
    } else {
      entries.push({ type: 'step', step })
    }
  }
  return entries
}
