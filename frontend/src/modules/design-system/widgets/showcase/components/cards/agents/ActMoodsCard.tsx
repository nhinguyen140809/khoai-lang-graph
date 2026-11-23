'use client'

import { Actor } from '@/shared/components/act'

import type { CardEntry } from '../../../design-system.types'
import { SampleCard, SampleGroup, SampleLabel } from '../../Sample'

// Faces to give a mood to: the mood of work in general leaves the mood of the act, any other takes over.
const moodSamples = [
  { label: 'no mood given', mood: undefined },
  { label: 'working', mood: 'working' },
  { label: 'worried', mood: 'worried' },
  { label: 'waiting', mood: 'waiting' },
] as const

export function ActMoodsCard() {
  return (
    <SampleCard title="Act moods" description="The mood that a face keeps while an act plays.">
      <SampleGroup label="The mood of the face: work in general leaves the mood of the act (thinking, for a hard problem), any other mood is kept">
        <div className="flex flex-wrap items-end gap-x-14 gap-y-6 px-10 py-6">
          {moodSamples.map(({ label, mood }) => (
            <div key={label} className="flex flex-col items-start gap-4">
              <Actor seed="validator" size="xl" acts={['analyze']} {...(mood && { mood })} />
              <SampleLabel>{label}</SampleLabel>
            </div>
          ))}
        </div>
      </SampleGroup>
    </SampleCard>
  )
}

export const actMoodsCardEntry = {
  id: 'act-moods',
  label: 'Act moods',
  section: 'agents',
  span: 6,
  keywords: 'act mood face working worried waiting Actor',
  View: ActMoodsCard,
} satisfies CardEntry
