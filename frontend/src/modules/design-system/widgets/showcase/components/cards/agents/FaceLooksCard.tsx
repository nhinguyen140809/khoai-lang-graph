'use client'

import { AgentFace, blobShapes, eyeGaps } from '@/shared/components/face'

import type { CardEntry } from '../../../design-system.types'
import { seedWhere } from '../../../design-system.utils'
import { SampleCard, SampleGroup, SampleLabel } from '../../Sample'

const colorCounts = [1, 2] as const

/** A face with the seed that gives it its look, named under it; nothing when no seed does. */
function LookFace({ seed, label }: { seed: string | null; label: string }) {
  if (seed === null) return null
  return (
    <div className="flex flex-col items-start gap-2">
      <AgentFace seed={seed} size="xl" />
      <SampleLabel>{label}</SampleLabel>
      <SampleLabel className="opacity-70">{seed}</SampleLabel>
    </div>
  )
}

export function FaceLooksCard() {
  return (
    <SampleCard
      title="Face looks"
      description="What a face takes from its seed besides its outline: the shape of its blobs, how far apart its eyes are, and whether it has one color or two. Each look is shown by a seed that gives it."
      className="flex flex-col gap-10"
    >
      <SampleGroup label="The shape of the deep blob">
        <div className="flex flex-wrap gap-x-10 gap-y-8">
          {blobShapes.map((shape) => (
            <LookFace
              key={shape}
              label={shape}
              seed={seedWhere((look) => look.blobs[0].shape === shape)}
            />
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="How far apart the eyes are">
        <div className="flex flex-wrap gap-x-10 gap-y-8">
          {eyeGaps.map((gap) => (
            <LookFace key={gap} label={gap} seed={seedWhere((look) => look.gap === gap)} />
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="One color, or two">
        <div className="flex flex-wrap gap-x-10 gap-y-8">
          {colorCounts.map((count) => (
            <LookFace
              key={count}
              label={count === 1 ? 'one color' : 'two colors'}
              seed={seedWhere((look) => look.colors.length === count)}
            />
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="The blobs by the pace of the mood: still for a calm one (idle), drifting for a busy one (working)">
        <div className="flex flex-wrap gap-x-10 gap-y-8">
          <div className="flex flex-col items-start gap-2">
            <AgentFace seed="analyst" size="xl" mood="idle" />
            <SampleLabel>calm</SampleLabel>
          </div>
          <div className="flex flex-col items-start gap-2">
            <AgentFace seed="analyst" size="xl" mood="working" />
            <SampleLabel>busy</SampleLabel>
          </div>
        </div>
      </SampleGroup>
    </SampleCard>
  )
}

export const faceLooksCardEntry = {
  id: 'face-looks',
  label: 'Face looks',
  section: 'agents',
  span: 12,
  keywords: 'face look blob shape eye gap color pace seed AgentFace',
  View: FaceLooksCard,
} satisfies CardEntry
