import { describe, expect, it } from 'vitest'

import { threadsByAttention, threadsWithUnfinishedRun } from '../threads.utils'
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

describe('threadsWithUnfinishedRun', () => {
  it.each(unfinishedCases)('keeps the threads with an unfinished run among $name', (item) => {
    expect(threadsWithUnfinishedRun(item.threads).map(({ id }) => id)).toEqual(item.ids)
  })
})
