'use client'

import { cn } from 'cn'
import type { LucideIcon } from 'lucide-react'
import { BrainIcon, ChevronRightIcon, SparkleIcon, WrenchIcon } from 'lucide-react'

import type { StepNote, StepNoteKind } from '@/modules/run/entities'
import { Markdown } from '@/shared/components/ui/markdown'
import { toneClasses } from '@/shared/lib/tone'

// The mark of each kind of note, looked up by the kind instead of branched on, so that a new kind
// fails to compile until it has a mark.
const noteMarks = {
  doing: ChevronRightIcon,
  finding: SparkleIcon,
  tool: WrenchIcon,
  thinking: BrainIcon,
} as const satisfies Record<StepNoteKind, LucideIcon>

/**
 * One note: the mark of its kind, in the yellow of the charts, then its Markdown, in the text colour
 * for what it found and muted for the rest. While it is in progress, it shimmers like the title of its line, so the one thing
 * in progress reads at a glance.
 */
export function StepNoteLine({
  note,
  inProgress,
  hasMark = true,
}: {
  note: StepNote
  inProgress: boolean
  /** Whether the line starts with the mark of its kind; the lines under the line of a tool leave it out, since the line says what they are. */
  hasMark?: boolean
}) {
  const Mark = noteMarks[note.kind]
  return (
    <div
      data-kind={note.kind}
      {...(inProgress && { 'data-status': 'running' })}
      className={cn(
        'group/note flex min-w-0 items-start gap-2 text-muted-foreground data-[kind=finding]:text-foreground',
        toneClasses.chart,
      )}
    >
      {hasMark && <Mark aria-hidden className="mt-1 size-3.5 shrink-0 text-(--tone-strong)" />}
      <div className="min-w-0 flex-1 in-data-[status=running]:shimmer motion-reduce:shimmer-none">
        <Markdown>{note.text}</Markdown>
      </div>
    </div>
  )
}
