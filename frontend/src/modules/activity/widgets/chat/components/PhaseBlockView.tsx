'use client'

import { TraceCollapsible, TraceCollapsibleContent } from '@/shared/components/ui/trace'

import type { PhaseBlock } from '../phase-blocks.types'
import { ChatEntry } from './ChatEntry'
import type { PhaseControl } from './EntryView'

interface PhaseBlockViewProps {
  block: Extract<PhaseBlock, { type: 'phase' }>
  phase: PhaseControl
  isTarget: (entryId: string) => boolean
}

/**
 * A phase of work: its separator, which opens and closes what is under it, and the items under it
 * in the content of a trace, which grows and shrinks as it opens and closes and hangs them on a
 * line down from the separator.
 */
export function PhaseBlockView({ block, phase, isTarget }: PhaseBlockViewProps) {
  return (
    <TraceCollapsible open={phase.isOpen}>
      {block.header !== null && (
        <ChatEntry entry={block.header} isTarget={isTarget(block.header.id)} phase={phase} />
      )}
      {block.items.length > 0 && (
        <TraceCollapsibleContent>
          {block.items.map((entry) => (
            <ChatEntry key={entry.id} entry={entry} isTarget={isTarget(entry.id)} />
          ))}
        </TraceCollapsibleContent>
      )}
    </TraceCollapsible>
  )
}
