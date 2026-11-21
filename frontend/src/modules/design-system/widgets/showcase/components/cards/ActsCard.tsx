'use client'

import { useState } from 'react'

import { actCatalog, actKeys, Actor, type ActSize, actSizes } from '@/shared/components/act'
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'

import { SampleCard, SampleGroup, SampleLabel } from '../Sample'

// What the page can play: each act alone, and a few of them one after another.
const actChoices: Readonly<Record<string, readonly string[]>> = {
  'in turn': ['write', 'typing', 'question', 'review'],
  ...Object.fromEntries(actKeys.map((key) => [key, [key]])),
}

// Faces to give a mood to: the mood of work in general leaves the mood of the act, any other takes over.
const moodSamples = [
  { label: 'no mood given', mood: undefined },
  { label: 'working', mood: 'working' },
  { label: 'worried', mood: 'worried' },
  { label: 'waiting', mood: 'waiting' },
] as const

// The persona that an interview talks to: its face comes from its role and its name.
const personaSeed = 'respondent/Minh'

export function ActsCard() {
  const [choice, setChoice] = useState('in turn')
  const [size, setSize] = useState<ActSize>('xl')

  return (
    <SampleCard
      title="Acts"
      description="What an agent does, drawn around its face in its colors: each act is made of the things around the face, each in a slot, coming in and going by a motion, moving about its slot and doing something in its place, and of how the eyes and the body of the face follow. A stage or a tool of the workflow names the acts that show while it runs. The face keeps its mood of work in general, except for an act that asks for a mood, such as the thinking of a hard problem; any other mood that is given is kept. A work done by two, such as an interview, draws the other agent, whose face comes from its role and its name."
      className="flex flex-col gap-6"
    >
      <SampleGroup label="One act at a time, or some in turn; the face is as large as the largest face, or larger">
        <div className="flex flex-wrap items-center gap-x-16 gap-y-8 px-12 py-12">
          <Actor seed="analyst" size={size} acts={actChoices[choice] ?? []} partner={personaSeed} />
          <div className="flex flex-col gap-3">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={choice}
              onValueChange={(next) => {
                const chosen = Object.keys(actChoices).find((candidate) => candidate === next)
                if (chosen !== undefined) setChoice(chosen)
              }}
              aria-label="Act"
              className="flex-wrap"
            >
              {Object.keys(actChoices).map((candidate) => (
                <ToggleGroupItem key={candidate} value={candidate}>
                  {candidate}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={size}
              onValueChange={(next) => {
                const chosen = actSizes.find((candidate) => candidate === next)
                if (chosen !== undefined) setSize(chosen)
              }}
              aria-label="Size of the face"
            >
              {actSizes.map((candidate) => (
                <ToggleGroupItem key={candidate} value={candidate}>
                  {candidate}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </SampleGroup>
      <SampleGroup label="Every act, each with its own agent">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 px-10 py-8 sm:grid-cols-3 lg:grid-cols-4">
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
