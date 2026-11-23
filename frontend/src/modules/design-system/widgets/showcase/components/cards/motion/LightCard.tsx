'use client'

import { Fragment } from 'react'

import { Glint, Shimmer, TypedText } from '@/shared/components/animation'

import type { CardEntry } from '../../../design-system.types'
import { Replay } from '../../Replay'
import { SampleCard, SampleGroup, SampleLabel } from '../../Sample'

const shimmerTones = ['neutral', 'primary', 'secondary', 'success', 'warning', 'accent'] as const

export function LightCard() {
  return (
    <SampleCard
      title="Shimmer and glint"
      description="Light that crosses text, and the star that shifts color."
      columns
    >
      <SampleGroup label="Shimmer: light crosses the text, solid fills it with the tone">
        <div className="grid grid-cols-3 items-center gap-x-6 gap-y-2 text-sm">
          <span />
          <SampleLabel>light</SampleLabel>
          <SampleLabel>solid</SampleLabel>
          {shimmerTones.map((tone) => (
            <Fragment key={tone}>
              <SampleLabel>{tone}</SampleLabel>
              <Shimmer color={tone}>Analysing the transcript</Shimmer>
              <Shimmer color={tone} variant="solid">
                Analysing the transcript
              </Shimmer>
            </Fragment>
          ))}
        </div>
      </SampleGroup>
      <Replay label="TypedText: the words come in one after another, and the line stays centered">
        {() => (
          <p className="text-center text-lg font-semibold">
            <TypedText text="What do you want to build?" />
          </p>
        )}
      </Replay>
      <SampleGroup label="Glint: the star in one color, in a mesh of two colors, and with a color that shifts between two">
        <div className="flex flex-wrap items-center gap-6">
          <Glint aria-hidden color="secondary" />
          <Glint aria-hidden color="secondary" className="size-6" />
          <Glint aria-hidden color="secondary" className="size-10" />
          <Glint aria-hidden variant="mesh" />
          <Glint aria-hidden variant="mesh" className="size-6" />
          <Glint aria-hidden variant="mesh" className="size-10" />
          <Glint aria-hidden variant="shift" />
          <Glint aria-hidden variant="shift" className="size-6" />
          <Glint aria-hidden variant="shift" className="size-10" />
          <Glint
            aria-hidden
            variant="mesh"
            className="size-10"
            colors={['var(--chart-5)', 'var(--chart-2)']}
          />
          <Glint
            aria-hidden
            variant="shift"
            className="size-10"
            colors={['var(--chart-5)', 'var(--chart-3)']}
          />
        </div>
      </SampleGroup>
    </SampleCard>
  )
}

export const lightCardEntry = {
  id: 'light',
  label: 'Shimmer and glint',
  section: 'motion',
  span: 6,
  keywords: 'shimmer glint light text Shimmer Glint',
  View: LightCard,
} satisfies CardEntry
