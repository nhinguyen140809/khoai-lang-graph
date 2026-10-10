import { describe, expect, it } from 'vitest'

import { mostUrgentRunStatus } from '../project-list.utils'

describe('mostUrgentRunStatus', () => {
  it('is the status that needs the user most, with the number of runs in it', () => {
    expect(mostUrgentRunStatus({ queued: 1, running: 2, interrupted: 1 })).toEqual({
      status: 'interrupted',
      count: 1,
    })
    expect(mostUrgentRunStatus({ queued: 1, running: 2, interrupted: 0 })).toEqual({
      status: 'running',
      count: 2,
    })
    expect(mostUrgentRunStatus({ queued: 0, running: 0, interrupted: 0 })).toBeUndefined()
  })
})
