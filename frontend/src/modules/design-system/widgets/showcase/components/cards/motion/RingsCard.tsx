'use client'

import { Rings } from '@/shared/components/animation'

import type { CardEntry } from '../../../design-system.types'
import { SampleCard, SampleGroup } from '../../Sample'

export function RingsCard() {
  return (
    <SampleCard
      title="Rings"
      description="Two outlines that turn against each other and change shape."
    >
      <SampleGroup label="Rings: two outlines that turn against each other and change shape; the colors can be given">
        <div className="flex flex-wrap items-center gap-6">
          <Rings aria-hidden size="sm" />
          <Rings aria-hidden />
          <Rings aria-hidden size="lg" />
          <Rings aria-hidden variant="angular" size="sm" />
          <Rings aria-hidden variant="angular" />
          <Rings aria-hidden variant="angular" size="lg" />
          <Rings aria-hidden size="lg" colors={['var(--chart-1)', 'var(--chart-5)']} />
          <Rings
            aria-hidden
            variant="angular"
            size="lg"
            colors={['var(--chart-3)', 'var(--chart-2)']}
          />
        </div>
      </SampleGroup>
    </SampleCard>
  )
}

export const ringsCardEntry = {
  id: 'rings',
  label: 'Rings',
  section: 'motion',
  span: 6,
  keywords: 'rings outlines turn angular Rings',
  View: RingsCard,
} satisfies CardEntry
