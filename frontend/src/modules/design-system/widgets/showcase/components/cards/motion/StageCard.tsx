'use client'

import { FolderOpenIcon } from 'lucide-react'

import { CardStack, Loop, LoopStep } from '@/shared/components/animation'
import { EmptyState } from '@/shared/components/state'

import type { CardEntry } from '../../../design-system.types'
import { SampleCard, SampleGroup } from '../../Sample'

export function StageCard() {
  return (
    <SampleCard
      title="Stacks, loops and states"
      description="A pile of cards, a drawing that loops, the stage at work, and an empty page."
    >
      <SampleGroup label="CardStack: cards in a pile; the front one grows and fades away, the others come forward">
        <CardStack
          items={[
            {
              label: 'Interviews',
              render: () => <p className="p-3 text-sm">Plan the interviews</p>,
            },
            {
              label: 'Personas',
              render: () => <p className="p-3 text-sm">Propose the personas</p>,
            },
            { label: 'Backlog', render: () => <p className="p-3 text-sm">Write the backlog</p> },
          ]}
        />
      </SampleGroup>
      <SampleGroup label="Loop and LoopStep: the parts of a drawing come in one after the other, stay, and go together at the end of the cycle">
        <svg viewBox="0 0 120 32" className="h-10 text-primary" fill="currentColor" aria-hidden>
          <Loop isPlaying>
            <LoopStep at={0}>
              <circle cx="16" cy="16" r="8" />
            </LoopStep>
            <LoopStep at={0.2}>
              <circle cx="60" cy="16" r="8" />
            </LoopStep>
            <LoopStep at={0.4}>
              <circle cx="104" cy="16" r="8" />
            </LoopStep>
          </Loop>
        </svg>
      </SampleGroup>
      <SampleGroup label="Breathe: the stage at work fades down and back in place, where Shimmer travels over the text">
        <p className="animate-breathe text-sm motion-reduce:animate-none">
          Writing the specification
        </p>
      </SampleGroup>
      <SampleGroup label="EmptyState in the page size, with the glow of its place">
        <div className="h-56 rounded-md border">
          <EmptyState
            title="No documents yet"
            description="The documents of the project show here once the agents have written them."
            icon={FolderOpenIcon}
          />
        </div>
      </SampleGroup>
      <SampleGroup label="Already in motion">
        <p className="text-sm text-muted-foreground">
          Sheet, Drawer, Dialog, popovers and menus slide or fade in and out; try them in Overlays.
          The collapsing sidebar moves its width, and so do the side and bottom panels of the
          workspace when they are hidden or shown; dragging them follows the pointer at once.
        </p>
      </SampleGroup>
    </SampleCard>
  )
}

export const stageCardEntry = {
  id: 'stage',
  label: 'Stacks, loops and states',
  section: 'motion',
  span: 6,
  keywords: 'card stack loop breathe empty state CardStack Loop LoopStep EmptyState',
  View: StageCard,
} satisfies CardEntry
