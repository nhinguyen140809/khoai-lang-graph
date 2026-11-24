'use client'

import { Glow, type GlowBlur, type GlowShape } from '@/shared/components/animation'

import type { CardEntry } from '../../../design-system.types'
import { SampleCard, SampleGroup, SampleLabel } from '../../Sample'

// Each shape at a size that shows its outline in a cell of about 15rem; the blob and the streak lean.
const glowShapes = [
  { shape: 'circle', width: '9rem', height: '9rem', rotate: undefined },
  { shape: 'ellipse', width: '14rem', height: '6rem', rotate: -12 },
  { shape: 'streak', width: '18rem', height: '3rem', rotate: 8 },
  { shape: 'blob', width: '12rem', height: '8rem', rotate: -18 },
] as const satisfies readonly {
  shape: GlowShape
  width: string
  height: string
  rotate: number | undefined
}[]

const blurs = ['sm', 'md', 'lg', 'xl'] as const satisfies readonly GlowBlur[]

/** A cell that holds a glow in the middle, with its name at the bottom; the glow stays inside it. */
function GlowCell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="relative isolate flex h-52 items-end overflow-hidden rounded-md border p-3">
      {children}
      <SampleLabel>{name}</SampleLabel>
    </div>
  )
}

const glowPlace = 'absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2'

export function GlowCard() {
  return (
    <SampleCard
      title="Glow"
      description="Soft light in the colors of the interface: four outlines, and the softness of the edge."
      className="flex flex-col gap-6"
    >
      <SampleGroup label="Shapes: round, wider than tall, a long soft streak, or an uneven blob; the last two can lean">
        <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-4">
          {glowShapes.map(({ shape, width, height, rotate }, index) => (
            <GlowCell
              key={shape}
              name={`${shape}${rotate === undefined ? '' : `, ${String(rotate)} deg`}`}
            >
              <Glow
                shape={shape}
                blur="sm"
                width={width}
                height={height}
                color={index % 2 === 0 ? 'primary' : 'secondary'}
                strength={80}
                rotate={rotate}
                entrance="grow"
                className={glowPlace}
              />
            </GlowCell>
          ))}
        </div>
      </SampleGroup>
      <SampleGroup label="Blur: from a little blurred to very soft, on the same circle">
        <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-4">
          {blurs.map((blur) => (
            <GlowCell key={blur} name={`blur ${blur}`}>
              <Glow
                shape="circle"
                blur={blur}
                width="9rem"
                height="9rem"
                color="primary"
                strength={80}
                entrance="none"
                className={glowPlace}
              />
            </GlowCell>
          ))}
        </div>
      </SampleGroup>
    </SampleCard>
  )
}

export const glowCardEntry = {
  id: 'glow',
  label: 'Glow',
  section: 'motion',
  span: 12,
  keywords: 'glow light blob streak ellipse circle blur soft Glow',
  View: GlowCard,
} satisfies CardEntry
