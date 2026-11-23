'use client'

import { entrances, exits } from '@/shared/components/act'

import type { CardEntry } from '../../../design-system.types'
import { keysOf, lookOf } from '../../../design-system.utils'
import { MotionRow } from '../../MotionRow'
import { SampleCard, SampleGroup } from '../../Sample'

export function ActEntrancesCard() {
  return (
    <SampleCard
      title="Act entrances and exits"
      description="How a thing comes in and how it goes, each motion alone."
      className="flex flex-col gap-6"
    >
      <SampleGroup label="Coming in (enter)">
        <MotionRow looks={lookOf(keysOf(entrances), (enter) => ({ enter }))} />
      </SampleGroup>
      <SampleGroup label="Going (exit)">
        <MotionRow looks={lookOf(keysOf(exits), (exit) => ({ exit }))} />
      </SampleGroup>
    </SampleCard>
  )
}

export const actEntrancesCardEntry = {
  id: 'act-entrances',
  label: 'Act entrances and exits',
  section: 'motion',
  span: 6,
  keywords: 'motion act enter exit animation MotionDemo',
  View: ActEntrancesCard,
} satisfies CardEntry
