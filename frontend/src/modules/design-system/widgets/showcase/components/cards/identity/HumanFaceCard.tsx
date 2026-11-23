'use client'

import { Actor } from '@/shared/components/act'
import { HumanFace, moods } from '@/shared/components/face'

import type { CardEntry } from '../../../design-system.types'
import { SampleCard, SampleGroup, SampleLabel } from '../../Sample'

export function HumanFaceCard() {
  return (
    <SampleCard
      title="Human face"
      description="The face of a person, a sketch for now: a head on shoulders with two eyes, made of what every face is made of, so that it takes the props of an agent face and moves as one does: the body breathes and bounces, the head sways and tilts, the eyes look about and blink."
      className="flex flex-col gap-10"
    >
      <SampleGroup label="One person in each mood">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 @xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-8">
          {moods.map((mood) => (
            <div key={mood} className="flex flex-col items-start gap-2">
              <HumanFace seed="ada" size="xl" mood={mood} />
              <SampleLabel>{mood}</SampleLabel>
            </div>
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="At work: an actor takes any face, and the other agent of a work done by two has the same kind">
        <Actor seed="ada" size="xl" acts={['interview']} partner="bob" face={HumanFace} />
      </SampleGroup>
    </SampleCard>
  )
}

export const humanFaceCardEntry = {
  id: 'human-face',
  label: 'Human face',
  section: 'identity',
  span: 12,
  keywords: 'face human person user avatar HumanFace',
  View: HumanFaceCard,
} satisfies CardEntry
