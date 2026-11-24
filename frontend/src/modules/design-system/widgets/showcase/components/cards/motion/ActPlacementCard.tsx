'use client'

import { effects, faceMoves } from '@/shared/components/act'

import { positionLooks } from '../../../design-system.fixtures'
import type { CardEntry } from '../../../design-system.types'
import { keysOf, lookOf, withDefaults } from '../../../design-system.utils'
import { MotionRow } from '../../MotionRow'
import { SampleCard, SampleGroup } from '../../Sample'

export function ActPlacementCard() {
  return (
    <SampleCard
      title="Act position and effects"
      description="Where a thing stands, what it does in its place, and how the whole face moves."
      className="flex flex-col gap-6"
    >
      <SampleGroup label="Position (slot, distance and offset): a thing may stand over the face; distance 1 is as far from the middle as the slot is, 0 is on the middle">
        <MotionRow looks={withDefaults(positionLooks, { enter: 'none', exit: 'none' })} />
      </SampleGroup>
      <SampleGroup label="In its place (effect)">
        <MotionRow looks={lookOf(keysOf(effects), (effect) => ({ effect }))} />
      </SampleGroup>
      <SampleGroup label="Of the whole face (move)">
        <MotionRow looks={lookOf(keysOf(faceMoves), (move) => ({ move }))} />
      </SampleGroup>
    </SampleCard>
  )
}

export const actPlacementCardEntry = {
  id: 'act-placement',
  label: 'Act position and effects',
  section: 'motion',
  span: 12,
  keywords: 'motion act position slot effect move MotionDemo',
  View: ActPlacementCard,
} satisfies CardEntry
