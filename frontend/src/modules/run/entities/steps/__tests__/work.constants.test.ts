import { describe, expect, it } from 'vitest'

import type { WorkStatus } from '../run-steps.types'
import { workMessages, workStatusLabels } from '../work.constants'

describe('workMessages', () => {
  it.each([
    { name: 'both', written: 2, updated: 1, writes: '2 written, 1 updated' },
    { name: 'written only', written: 3, updated: 0, writes: '3 written' },
    { name: 'updated only', written: 0, updated: 1, writes: '1 updated' },
    { name: 'none', written: 0, updated: 0, writes: '' },
  ])('reads the writes of $name', ({ written, updated, writes }) => {
    expect(workMessages.writes(written, updated)).toBe(writes)
  })

  it.each([
    {
      name: 'less than a minute',
      took: workMessages.took.lessThanAMinute,
      read: 'Took less than a minute',
    },
    { name: 'one minute', took: workMessages.took.minutes(1), read: 'Took 1 minute' },
    { name: 'several minutes', took: workMessages.took.minutes(2), read: 'Took 2 minutes' },
    { name: 'one hour', took: workMessages.took.hours(1, 0), read: 'Took 1 hour' },
    {
      name: 'an hour and minutes',
      took: workMessages.took.hours(1, 5),
      read: 'Took 1 hour 5 minutes',
    },
  ])('reads $name', ({ took, read }) => {
    expect(took).toBe(read)
  })
})

describe('workStatusLabels', () => {
  it('labels every status of a line of work', () => {
    const statuses: WorkStatus[] = ['running', 'waiting', 'stopped', 'done', 'failed']
    for (const status of statuses) {
      expect(workStatusLabels[status].user).not.toBe('')
      expect(workStatusLabels[status].developer).not.toBe('')
    }
  })
})
