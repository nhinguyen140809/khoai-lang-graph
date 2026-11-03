import { describe, expect, it } from 'vitest'

import { stoppableRun } from '../stop-run.utils'
import { stoppableRunCases } from './stop-run.utils.data'

describe('stoppableRun', () => {
  it.each(stoppableRunCases)('stops $name: $stoppable', ({ run, stoppable }) => {
    expect(stoppableRun(run)).toBe(stoppable ? run : null)
  })
})
