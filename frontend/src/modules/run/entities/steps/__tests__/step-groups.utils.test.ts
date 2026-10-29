import { describe, expect, it } from 'vitest'

import type { StepEntry } from '../run-steps.types'
import { groupSteps } from '../step-groups.utils'
import { groupCases } from './step-groups.utils.data'

/** An entry as text: the sequence of a step, or the key and the sequences of a group. */
function describeEntry(entry: StepEntry): string {
  return entry.type === 'step'
    ? String(entry.step.sequence)
    : `${entry.key}: ${entry.steps.map(({ sequence }) => String(sequence)).join('+')}`
}

describe('groupSteps', () => {
  it.each(groupCases)('makes the entries for $name', ({ steps, entries }) => {
    expect(groupSteps(steps).map(describeEntry)).toEqual(entries)
  })
})
