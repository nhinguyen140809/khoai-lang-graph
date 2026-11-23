'use client'

import { useState } from 'react'

import { actKeys, Actor, type ActSize, actSizes } from '@/shared/components/act'
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'

import { personaSeed } from '../../../design-system.fixtures'
import type { CardEntry } from '../../../design-system.types'
import { SampleCard, SampleGroup } from '../../Sample'

// What the page can play: each act alone, and a few of them one after another.
const actChoices: Readonly<Record<string, readonly string[]>> = {
  'in turn': ['write', 'typing', 'question', 'review'],
  ...Object.fromEntries(actKeys.map((key) => [key, [key]])),
}

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
    </SampleCard>
  )
}

export const actsCardEntry = {
  id: 'acts',
  label: 'Acts',
  section: 'agents',
  span: 6,
  keywords: 'act agent role Actor',
  View: ActsCard,
} satisfies CardEntry
