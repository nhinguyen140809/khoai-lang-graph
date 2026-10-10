import { describe, expect, it } from 'vitest'

import { mockThreads } from '@/mocks/threads.fixtures'

import { formatCost, pickStatusThread, unfinishedThreads } from '../run-status.utils'
import type { Thread } from '../threads.types'

const [base] = mockThreads('waiting')
if (base === undefined) throw new Error('No mock thread')

const thread = (id: string, status: Thread['active_run_status']): Thread => ({
  ...base,
  id,
  active_run_id: status === null ? null : `run-${id}`,
  active_run_status: status,
})

describe('unfinishedThreads', () => {
  it('lists the threads with an unfinished run, the most urgent first', () => {
    const ids = unfinishedThreads([
      thread('a', 'queued'),
      thread('b', null),
      thread('c', 'running'),
      thread('d', 'interrupted'),
    ]).map(({ id }) => id)

    expect(ids).toEqual(['d', 'c', 'a'])
  })
})

describe('pickStatusThread', () => {
  it('prefers a run waiting for review, then a running one, then a queued one', () => {
    expect(
      pickStatusThread([thread('a', 'running'), thread('b', 'queued'), thread('c', 'interrupted')])
        ?.id,
    ).toBe('c')
    expect(pickStatusThread([thread('a', 'queued'), thread('b', 'running')])?.id).toBe('b')
  })

  it('takes the thread with the newest message on a tie, and none without unfinished runs', () => {
    expect(pickStatusThread([thread('newer', 'running'), thread('older', 'running')])?.id).toBe(
      'newer',
    )
    expect(pickStatusThread([thread('a', null)])).toBeUndefined()
  })
})

describe('formatCost', () => {
  it('shows dollars with two decimals', () => {
    expect(formatCost(0.42)).toBe('$0.42')
    expect(formatCost(2)).toBe('$2.00')
  })
})
