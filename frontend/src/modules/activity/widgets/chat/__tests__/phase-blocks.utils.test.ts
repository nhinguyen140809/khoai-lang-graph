import { describe, expect, it } from 'vitest'

import type { ActivityEntry } from '@/modules/activity/entities'

import { livePhaseIdOf, phaseBlocks } from '../phase-blocks.utils'

const at = '2026-10-06T10:00:00Z'
const phase = (id: string, status = 'running') =>
  ({ type: 'phase', id, time: at, work: { status } }) as unknown as ActivityEntry
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

describe('livePhaseIdOf', () => {
  it('is the phase at the end of a live run that is running', () => {
    expect(
      livePhaseIdOf(phaseBlocks([phase('p1', 'done'), phase('p2'), item('n1', 'p2')]), true),
    ).toBe('p2')
  })

  it('is none when a message comes after it, though the run is live', () => {
    expect(
      livePhaseIdOf(phaseBlocks([phase('p1'), item('n1', 'p1'), message('m1')]), true),
    ).toBeNull()
  })

  it('is none when the phase at the end is over, or the run is not live', () => {
    expect(livePhaseIdOf(phaseBlocks([phase('p1', 'done')]), true)).toBeNull()
    expect(livePhaseIdOf(phaseBlocks([phase('p1')]), false)).toBeNull()
  })

  it('is none for the rest of a phase that a message cut, which has no separator', () => {
    expect(
      livePhaseIdOf(phaseBlocks([phase('p1'), message('m1'), item('n2', 'p1')]), true),
    ).toBeNull()
  })
})
