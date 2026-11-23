'use client'

import { LoadingState } from '@/shared/components/state'

import { layouts } from '../../../design-system.fixtures'
import type { CardEntry } from '../../../design-system.types'
import { SampleCard, SampleGroup } from '../../Sample'

export function LoadingLayoutsCard() {
  return (
    <SampleCard
      title="Loading layouts"
      description="The placeholder takes the shape of the content it stands in for, and fills the width and the height of its container; a layout adds rows, or makes its blocks taller."
      columns
    >
      {layouts.map((entry) => (
        <SampleGroup
          key={entry.note}
          label={`LoadingState layout="${entry.layout}": ${entry.note}`}
        >
          <div className="h-56 overflow-hidden rounded-md border">
            <LoadingState
              label={`Loading ${entry.layout}`}
              layout={entry.layout}
              rows={entry.rows}
              columns={entry.columns}
              alternate={entry.alternate}
            />
          </div>
        </SampleGroup>
      ))}
    </SampleCard>
  )
}

export const loadingLayoutsCardEntry = {
  id: 'loading-layouts',
  label: 'Loading layouts',
  section: 'motion',
  span: 12,
  keywords:
    'loading placeholder skeleton layout lines list cards grid table feed document detail LoadingState',
  View: LoadingLayoutsCard,
} satisfies CardEntry
