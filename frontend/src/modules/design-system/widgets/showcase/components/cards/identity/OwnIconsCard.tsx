'use client'

import { type ComponentType } from 'react'

import { SpinningIcon } from '@/shared/components/animation'
import { DotIcon, ExclamationIcon, PauseSolidIcon, ZapSolidIcon } from '@/shared/components/icon'

import type { CardEntry } from '../../../design-system.types'
import { SampleCard } from '../../Sample'
import { IconBox, IconGrid, IconSample } from './IconSamples'

// The icons of our own that lucide does not have, and the one that turns by itself; they take a
// class for their size, as lucide icons do.
const ownIcons: readonly (readonly [string, ComponentType<{ className?: string }>])[] = [
  ['dot', DotIcon],
  ['exclamation', ExclamationIcon],
  ['pause-solid', PauseSolidIcon],
  ['zap-solid', ZapSolidIcon],
  ['spinning', SpinningIcon],
]

/** The icons of our own that lucide does not have, each large and as small as the interface uses it. */
export function OwnIconsCard() {
  return (
    <SampleCard
      title="Of our own"
      description="The icons of our own that lucide does not have, and the one that turns by itself; they take a class for their size, as lucide icons do."
      className="flex flex-col gap-6"
    >
      <IconGrid tone="primary">
        {ownIcons.map(([name, Icon]) => (
          <IconSample key={name} name={name}>
            <IconBox size="size-10" hasGuide={false}>
              <Icon className="size-full" />
            </IconBox>
            <IconBox size="size-4" hasGuide={false}>
              <Icon className="size-full" />
            </IconBox>
          </IconSample>
        ))}
      </IconGrid>
    </SampleCard>
  )
}

export const ownIconsCardEntry = {
  id: 'own-icons',
  label: 'Of our own',
  section: 'identity',
  span: 6,
  keywords:
    'dot exclamation pause zap spinning DotIcon ExclamationIcon PauseSolidIcon SpinningIcon ZapSolidIcon',
  View: OwnIconsCard,
} satisfies CardEntry
