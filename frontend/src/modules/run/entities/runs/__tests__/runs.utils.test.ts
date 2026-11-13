import { describe, expect, it } from 'vitest'

import { refetchIntervalOf, retriedRunsOf } from '../runs.utils'
import { pollCases } from './runs.utils.data'

describe('refetchIntervalOf', () => {
  it.each(pollCases)('answers for $name', ({ status, interval }) => {
    expect(refetchIntervalOf(status)).toBe(interval)
  })
})

describe('retriedRunsOf', () => {
  const runs = [
    { id: 'r3', retry_of_run_id: 'r2' },
    { id: 'r2', retry_of_run_id: 'r1' },
    { id: 'r1', retry_of_run_id: null },
  ]

  it('follows the retries back, the oldest first', () => {
    expect(retriedRunsOf({ retry_of_run_id: 'r2' }, runs).map(({ id }) => id)).toEqual(['r1', 'r2'])
  })

  it('gives none for a run that retries nothing, and stops at a run that is not listed', () => {
    expect(retriedRunsOf({ retry_of_run_id: null }, runs)).toEqual([])
    expect(retriedRunsOf({ retry_of_run_id: 'gone' }, runs)).toEqual([])
  })
})
