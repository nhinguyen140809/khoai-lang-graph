'use client'

import { Actor } from '@/shared/components/act'
import { type FaceSpec, HumanFace, moods } from '@/shared/components/face'
import { Button } from '@/shared/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'

import type { CardEntry } from '../../../design-system.types'
import { tagCategories, useRandomFaces } from '../../../hooks/useRandomFaces'
import { SampleCard, SampleGroup, SampleLabel } from '../../Sample'

/** What a face was generated as: the variant of each part and the token of each color, by name. */
function SpecNotes({ spec }: { spec: FaceSpec }) {
  const parts = Object.entries(spec.parts).filter(([, key]) => key !== null)
  return (
    <dl className="flex flex-col gap-0.5 text-xs">
      <div className="flex gap-2">
        <dt className="w-28 shrink-0 text-muted-foreground">palette</dt>
        <dd>{spec.palette ?? 'by the seed'}</dd>
      </div>
      {parts.map(([part, key]) => (
        <div key={part} className="flex gap-2">
          <dt className="w-28 shrink-0 text-muted-foreground">{part}</dt>
          <dd>{key}</dd>
        </div>
      ))}
      {Object.entries(spec.colors).map(([role, token]) => (
        <div key={role} className="flex gap-2">
          <dt className="w-28 shrink-0 text-muted-foreground">{role} color</dt>
          <dd>{token}</dd>
        </div>
      ))}
    </dl>
  )
}

const seeds = ['ada', 'bob', 'chi', 'dara', 'eli', 'fay', 'gus', 'hana']

/** Faces that someone chose: some parts and some tones named, the rest left to the seed. */
const specs: readonly { label: string; spec: FaceSpec }[] = [
  {
    label: 'mohawk, deep skin palette',
    spec: {
      style: 'plain',
      palette: 'deep-black-brown',
      parts: { hair: 'mohawk' },
      colors: { background: 'lavender' },
    },
  },
  {
    label: 'long wavy hair, round glasses, one tone changed',
    spec: {
      style: 'plain',
      palette: 'fair-auburn-green',
      parts: { hair: 'long-wavy', glasses: 'round' },
      colors: { glasses: 'blue', background: 'butter' },
    },
  },
  {
    label: 'full beard, gray hair',
    spec: {
      style: 'plain',
      palette: 'medium-gray-brown',
      parts: { hair: 'short-crop', beard: 'full' },
      colors: { background: 'sky' },
    },
  },
  {
    label: 'big curls, freckles, flowers',
    spec: {
      style: 'plain',
      palette: 'fair-blond-blue',
      parts: { hair: 'big-curls', freckles: 'freckles', hairAccessories: 'flowers' },
      colors: { background: 'rose' },
    },
  },
]

export function HumanFaceCard() {
  const { chosen, faces, choose, shuffle } = useRandomFaces()

  return (
    <SampleCard
      title="Human face"
      description="The face of a person, drawn from the catalog of faces: a seed picks every part, and a spec names the parts and the tones that were chosen. It takes the props of an agent face and moves as one does: the body breathes and bounces, the head sways and tilts, the eyes look about and blink, and the eyes and the mouth change with the mood."
      className="flex flex-col gap-10"
    >
      <SampleGroup label="One person in each mood">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 @xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-8">
          {moods.map((mood) => (
            <div key={mood} className="flex flex-col items-start gap-2">
              <HumanFace seed="fay" size="xl" mood={mood} />
              <SampleLabel>{mood}</SampleLabel>
            </div>
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="One mood, other seeds: a seed picks the parts and keeps them">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 @xl:grid-cols-4 @5xl:grid-cols-8">
          {seeds.map((seed) => (
            <div key={seed} className="flex flex-col items-start gap-2">
              <HumanFace seed={seed} size="xl" />
              <SampleLabel>{seed}</SampleLabel>
            </div>
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="Random faces within the tags: each kind of tag narrows the parts that fit, and every face is a random pick among them">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {tagCategories.map(({ key, values }) => (
            <div key={key} className="flex items-center gap-2">
              <SampleLabel>{key}</SampleLabel>
              <ToggleGroup
                type="multiple"
                variant="outline"
                size="sm"
                value={[...(chosen[key] ?? [])]}
                onValueChange={(next) => {
                  choose(key, next)
                }}
              >
                {values.map((value) => (
                  <ToggleGroupItem key={value} value={value}>
                    {value}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={shuffle}>
            Shuffle
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-10 @xl:grid-cols-4">
          {faces.map(({ seed, spec }) => (
            <div key={seed} className="flex flex-col items-start gap-3">
              <HumanFace seed={seed} size="2xl" spec={spec} />
              <SpecNotes spec={spec} />
            </div>
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="Chosen faces: a spec names parts and tones, the seed picks the rest">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 @xl:grid-cols-4">
          {specs.map(({ label, spec }) => (
            <div key={label} className="flex flex-col items-start gap-2">
              <HumanFace seed="gus" size="2xl" spec={spec} />
              <SampleLabel>{label}</SampleLabel>
            </div>
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="Frames: in a circle with the background of the face, or with none, which a place sets with the frame prop">
        <div className="flex items-end gap-8">
          {(['circle', 'none'] as const).map((frame) => (
            <div key={frame} className="flex flex-col items-start gap-2">
              <HumanFace seed="eli" size="2xl" frame={frame} />
              <SampleLabel>{frame}</SampleLabel>
            </div>
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="At work: an actor takes any face, and the other agent of a work done by two has the same kind">
        <Actor seed="fay" size="xl" acts={['interview']} partner="bob" face={HumanFace} />
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
