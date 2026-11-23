'use client'

import { useState } from 'react'

import { Face, type Mood, moods } from '@/shared/components/face'
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'

import type { CardEntry } from '../../../design-system.types'
import { SampleCard, SampleGroup, SampleLabel } from '../../Sample'

// What each mood is for, in the words of the run.
const moodUses: Record<Mood, string> = {
  idle: 'nothing to do',
  thinking: 'making up its mind',
  working: 'writing',
  waiting: 'waits for you',
  happy: 'done well',
  worried: 'failed',
  surprised: 'a new message',
  sleeping: 'stopped',
}

export function FaceMoodsCard() {
  const [mood, setMood] = useState<Mood>('idle')

  return (
    <SampleCard
      title="Face moods"
      description="The mood gives the eyes their size, their lean and a way of looking."
      className="flex flex-col gap-10"
    >
      <SampleGroup label="A change of mood goes gently: the eyes close for an instant">
        <div className="flex flex-wrap items-center gap-6">
          <Face seed="requirement_engineer" size="lg" mood={mood} />
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={mood}
            onValueChange={(next) => {
              const chosen = moods.find((candidate) => candidate === next)
              if (chosen !== undefined) setMood(chosen)
            }}
            aria-label="Mood"
            className="flex-wrap"
          >
            {moods.map((candidate) => (
              <ToggleGroupItem key={candidate} value={candidate}>
                {candidate}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </SampleGroup>
      <SampleGroup label="One agent in each mood">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 @xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-6">
          {moods.map((mood) => (
            <div key={mood} className="flex flex-col items-start gap-2">
              <Face seed="analyst" size="lg" mood={mood} />
              <SampleLabel>{mood}</SampleLabel>
              <SampleLabel className="opacity-70">{moodUses[mood]}</SampleLabel>
            </div>
          ))}
        </div>
      </SampleGroup>
    </SampleCard>
  )
}

export const faceMoodsCardEntry = {
  id: 'face-moods',
  label: 'Face moods',
  section: 'agents',
  span: 12,
  keywords: 'face mood expression Face',
  View: FaceMoodsCard,
} satisfies CardEntry
