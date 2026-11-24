'use client'

import { AgentFace } from '@/shared/components/face'

import type { CardEntry } from '../../../design-system.types'
import { useLookSeeds } from '../../../hooks/useLookSeeds'
import { SampleCard, SampleGroup, SampleLabel } from '../../Sample'

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
  const seeds = useLookSeeds()
  return (
    <SampleCard
      title="Face looks"
      description="What a face takes from its seed besides its outline: the shape of its blobs, how far apart its eyes are, and whether it has one color or two. Each look is shown by a seed that gives it."
      className="flex flex-col gap-10"
    >
      <SampleGroup label="The shape of the deep blob">
        <div className="flex flex-wrap gap-x-10 gap-y-8">
          {seeds.blobs.map(({ label, seed }) => (
            <LookFace key={label} label={label} seed={seed} />
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="How far apart the eyes are">
        <div className="flex flex-wrap gap-x-10 gap-y-8">
          {seeds.gaps.map(({ label, seed }) => (
            <LookFace key={label} label={label} seed={seed} />
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="One color, or two">
        <div className="flex flex-wrap gap-x-10 gap-y-8">
          {seeds.colors.map(({ label, seed }) => (
            <LookFace key={label} label={label} seed={seed} />
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
