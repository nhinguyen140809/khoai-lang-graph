import { describe, expect, it } from 'vitest'

import { orderedSteps } from '../run-steps.utils'
import { orderCases } from './run-steps.utils.data'

describe('orderedSteps', () => {
  it.each(orderCases)('orders $name', ({ steps, sequences }) => {
    expect(orderedSteps(steps).map(({ sequence }) => sequence)).toEqual(sequences)
  })

  it('leaves the given steps as they are', () => {
    const steps = orderCases[1]?.steps ?? []

    orderedSteps(steps)

    expect(steps.map(({ sequence }) => sequence)).toEqual([3, 1, 2])
  })
})
