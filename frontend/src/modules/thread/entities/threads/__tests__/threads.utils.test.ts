import { describe, expect, it } from 'vitest'

import { hasUnfinishedRun, threadsByAttention, threadsWithUnfinishedRun } from '../threads.utils'
import { attentionCases, unfinishedCases } from './threads.utils.data'

describe('threadsByAttention', () => {
  it.each(attentionCases)('orders $name', ({ threads, ids }) => {
    expect(threadsByAttention(threads).map(({ id }) => id)).toEqual(ids)
  })

  it('leaves the list it was given as it was', () => {
    const threads = attentionCases.flatMap((item) => item.threads).slice(0, 3)
    const before = threads.map(({ id }) => id)

    threadsByAttention(threads)

    expect(threads.map(({ id }) => id)).toEqual(before)
  })
})

describe('hasUnfinishedRun', () => {
  it('holds for a thread with an active run, and not for one without or without a thread', () => {
    expect(hasUnfinishedRun({ active_run_id: 'r1' })).toBe(true)
    expect(hasUnfinishedRun({ active_run_id: null })).toBe(false)
    expect(hasUnfinishedRun(null)).toBe(false)
  })
})

describe('threadsWithUnfinishedRun', () => {
  it.each(unfinishedCases)('keeps the threads with an unfinished run among $name', (item) => {
    expect(threadsWithUnfinishedRun(item.threads).map(({ id }) => id)).toEqual(item.ids)
  })
})
