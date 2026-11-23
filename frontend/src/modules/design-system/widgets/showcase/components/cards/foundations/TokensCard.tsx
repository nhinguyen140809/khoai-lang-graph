'use client'

import type { CardEntry } from '../../../design-system.types'
import { useTokenHexes } from '../../../hooks/useTokenHexes'
import { SampleCard, SampleLabel } from '../../Sample'

const groups: { title: string; tokens: string[] }[] = [
  {
    title: 'Surfaces',
    tokens: ['background', 'card', 'popover', 'sidebar', 'muted', 'secondary', 'accent'],
  },
  {
    title: 'Text and lines',
    tokens: ['foreground', 'muted-foreground', 'border', 'input', 'ring'],
  },
  {
    title: 'Actions and status',
    tokens: ['primary', 'success', 'success-strong', 'warning', 'warning-strong', 'destructive'],
  },
  {
    title: 'Strong and line',
    tokens: ['secondary-strong', 'secondary-line', 'warning-line', 'accent-line'],
  },
  {
    title: 'Chart',
    tokens: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'],
  },
  {
    title: 'Hues',
    tokens: [
      'hue-orange',
      'hue-yellow',
      'hue-lime',
      'hue-mint',
      'hue-sky',
      'hue-blue',
      'hue-violet',
      'hue-pink',
      'hue-rose',
      'hue-coral',
    ],
  },
  {
    title: 'Face',
    tokens: ['face-features'],
  },
]

const allTokens = groups.flatMap((group) => group.tokens)

export function TokensCard() {
  const { hexes, probeRef } = useTokenHexes(allTokens)

  return (
    <SampleCard
      title="Color tokens"
      description="Night Owl surfaces and blue, a yellow secondary, five chart colors, and the soft colors of the faces."
      columns
    >
      <span ref={probeRef} aria-hidden className="hidden" />
      {groups.map((group) => (
        <section key={group.title} className="flex flex-col gap-2">
          <h4 className="text-muted-foreground">{group.title}</h4>
          <div className="grid grid-cols-5 gap-2">
            {group.tokens.map((token) => (
              <div key={token} className="flex min-w-0 flex-col gap-1">
                <div
                  className="aspect-square rounded-md ring-1 ring-foreground/15"
                  style={{ backgroundColor: `var(--${token})` }}
                />
                <SampleLabel className="truncate">{token}</SampleLabel>
                <SampleLabel className="truncate">{hexes[token] ?? ''}</SampleLabel>
              </div>
            ))}
          </div>
        </section>
      ))}
    </SampleCard>
  )
}

export const tokensCardEntry = {
  id: 'tokens',
  label: 'Color tokens',
  section: 'foundations',
  span: 8,
  keywords: 'color palette theme background foreground border',
  View: TokensCard,
} satisfies CardEntry
