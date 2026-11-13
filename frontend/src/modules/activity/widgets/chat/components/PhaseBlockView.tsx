'use client'

import { TraceCollapsible, TraceCollapsibleContent } from '@/shared/components/ui/trace'

import type { PhaseBlock } from '../phase-blocks.types'
import { ChatEntry } from './ChatEntry'
import type { PhaseControl } from './PhaseControlContext'
import { PhaseControlProvider } from './PhaseControlContext'

interface PhaseBlockViewProps {
  block: Extract<PhaseBlock, { type: 'phase' }>
  phase: PhaseControl
}

/**
 * A phase of work: its separator, which opens and closes what is under it, and the items under it
 * in the content of a trace, which grows and shrinks as it opens and closes and hangs them on a
 * line down from the separator.
 */
export function PhaseBlockView({ block, phase }: PhaseBlockViewProps) {
  return (
    <PhaseControlProvider value={phase}>
      <TraceCollapsible open={phase.isOpen}>
        {block.header !== null && <ChatEntry entry={block.header} />}
        {block.items.length > 0 && (
          <TraceCollapsibleContent>
            {block.items.map((entry) => (
              <ChatEntry key={entry.id} entry={entry} />
            ))}
          </TraceCollapsibleContent>
        )}
      </TraceCollapsible>
    </PhaseControlProvider>
  )
}
