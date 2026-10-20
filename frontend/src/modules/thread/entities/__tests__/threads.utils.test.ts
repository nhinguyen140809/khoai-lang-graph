import { describe, expect, it } from 'vitest'

import { threadsByAttention } from '../threads.utils'
import { byAttentionCases } from './threads.utils.data'

describe('threadsByAttention', () => {
  it.each(byAttentionCases)('puts $name', ({ threads, order }) => {
    expect(threadsByAttention(threads).map(({ id }) => id)).toEqual(order)
  })
})
