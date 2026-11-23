'use client'

import { actCatalog, Actor } from '@/shared/components/act'

import { personaSeed } from '../../../design-system.fixtures'
import type { CardEntry } from '../../../design-system.types'
import { SampleCard, SampleGroup, SampleLabel } from '../../Sample'

export function ActCatalogCard() {
  return (
    <SampleCard
      title="Every act"
      description="The acts of the catalog, each drawn on its own agent."
    >
      <SampleGroup label="Every act, each with its own agent">
        <div className="grid grid-cols-2 gap-x-10 gap-y-12 px-10 py-8 @xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-5 @6xl:grid-cols-6">
          {actCatalog.acts.map(({ key, title, description }) => (
            <div key={key} className="flex flex-col items-start gap-10">
              <Actor
                seed={key}
                size="xl"
                acts={[key]}
                {...(key === 'interview' && { partner: personaSeed })}
              />
              <div className="flex flex-col gap-0.5">
                <SampleLabel>{title}</SampleLabel>
                <SampleLabel className="opacity-70">{description}</SampleLabel>
              </div>
            </div>
          ))}
        </div>
      </SampleGroup>
    </SampleCard>
  )
}

export const actCatalogCardEntry = {
  id: 'act-catalog',
  label: 'Every act',
  section: 'agents',
  span: 12,
  keywords: 'act catalog agent list Actor actCatalog',
  View: ActCatalogCard,
} satisfies CardEntry
