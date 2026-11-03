'use client'

import { Code } from '@/shared/components/ui/code'
import { CopyButton, type CopyDisplay } from '@/shared/components/ui/copy-button'

import { SampleCard, SampleGroup } from '../Sample'

const displays = ['icon', 'text', 'icon-text'] as const satisfies readonly CopyDisplay[]

// One label per display, so that a test can press the button it wants.
const displayLabels: Record<CopyDisplay, string> = {
  icon: 'Copy the key',
  text: 'Copy the version',
  'icon-text': 'Copy the run id',
}

export function CopyButtonCard() {
  return (
    <SampleCard
      title="Copy button"
      description={
        <>
          A click copies the value; the button says so for two seconds, then goes back to copying.
          It is a ghost button, in the success color while it says it. The icon alone shows its
          label in a tooltip.
        </>
      }
      className="flex flex-col gap-4"
    >
      {displays.map((display) => (
        <SampleGroup key={display} label={display}>
          <CopyButton
            value="5f2d0000-0000-4000-8000-000000000001"
            display={display}
            label={displayLabels[display]}
            size={display === 'icon' ? 'icon-sm' : 'sm'}
          />
        </SampleGroup>
      ))}
      <SampleGroup label="next to a value">
        <span className="flex items-center gap-2 text-sm">
          <Code>REQ-001</Code>
          <CopyButton value="REQ-001" label="Copy the value" size="icon-sm" />
        </span>
      </SampleGroup>
    </SampleCard>
  )
}
