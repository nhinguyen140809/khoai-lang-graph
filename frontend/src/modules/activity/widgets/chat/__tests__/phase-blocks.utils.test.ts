import { describe, expect, it } from 'vitest'

import type { ActivityEntry } from '@/modules/activity/entities'

import { phaseBlocks } from '../phase-blocks.utils'

const at = '2026-10-06T10:00:00Z'
const phase = (id: string) => ({ type: 'phase', id, time: at }) as unknown as ActivityEntry
const item = (id: string, phaseId: string) =>
  ({ type: 'note', id, time: at, phaseId }) as unknown as ActivityEntry
const message = (id: string) => ({ type: 'message', id, time: at }) as unknown as ActivityEntry

describe('phaseBlocks', () => {
  it('gives a separator the items that follow it', () => {
    const blocks = phaseBlocks([phase('p1'), item('n1', 'p1'), item('n2', 'p1'), phase('p2')])

    expect(blocks.map((block) => block.type === 'phase' && block.items.length)).toEqual([2, 0])
  })

  it('leaves a message on its own, and puts the items after it in a block without a separator', () => {
    const blocks = phaseBlocks([phase('p1'), item('n1', 'p1'), message('m1'), item('n2', 'p1')])

    expect(blocks.map((block) => block.type)).toEqual(['phase', 'entry', 'phase'])
    const last = blocks.at(-1)
    expect(last?.type === 'phase' && last.header).toBeNull()
    expect(last?.type === 'phase' && last.items.map(({ id }) => id)).toEqual(['n2'])
  })
})
