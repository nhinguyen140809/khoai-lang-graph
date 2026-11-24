'use client'

import { useState } from 'react'

import { AgentFace, type FaceState, type Mood, moods, unsetStates } from '@/shared/components/face'
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

// What each state that no one sets is, in the words of the run.
const stateUses: Record<string, string> = {
  'resting-idle': 'idle for long: looks aside and keeps still',
  'resting-happy': 'happy for long: stops swaying, keeps its smile',
  'thinking-long': 'thinking, step 2: long eyes',
  'thinking-squint': 'thinking, step 3: long eyes that squint',
}

/** The mood that a state comes from. */
function moodOfState(state: FaceState): Mood {
  return moods.find((mood) => state.includes(mood)) ?? 'idle'
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
          <AgentFace seed="requirement_engineer" size="lg" mood={mood} />
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
              <AgentFace seed="analyst" size="lg" mood={mood} />
              <SampleLabel>{mood}</SampleLabel>
              <SampleLabel className="opacity-70">{moodUses[mood]}</SampleLabel>
            </div>
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="States that no one sets: a face comes to rest after a long time of nothing to do, and a thinking face goes through looks">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 @xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-6">
          {unsetStates.map((state) => (
            <div key={state} className="flex flex-col items-start gap-2">
              <AgentFace seed="analyst" size="lg" mood={moodOfState(state)} state={state} />
              <SampleLabel>{state}</SampleLabel>
              <SampleLabel className="opacity-70">{stateUses[state]}</SampleLabel>
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
  keywords: 'face mood state resting thinking expression AgentFace',
  View: FaceMoodsCard,
} satisfies CardEntry
