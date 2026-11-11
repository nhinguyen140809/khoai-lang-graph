'use client'

import { ChevronRightIcon } from 'lucide-react'

import type { WorkEntry } from '@/modules/run/entities'
import { useWorkStatusLook, useWorkWords } from '@/modules/run/entities'
import { TraceDescription, TraceIcon, TraceLine, TraceTitle } from '@/shared/components/ui/trace'
import { useView } from '@/shared/lib/view'

import { activityChatMessages } from '../activity-chat.constants'
import { useRunActivity } from '../hooks/useRunActivity'

interface PhaseEntryViewProps {
  work: WorkEntry
  stageTitle: string | null
  subjectTitle: string | null
  isOpen: boolean
  onToggle: () => void
}

/**
 * The separator of a phase of work: its title and, in words, how it went. It opens and closes the
 * items under it. It carries no mark of its status: its title shimmers while it works, and the
 * items under it, such as its failure, are where the reader looks.
 */
export function PhaseEntryView({
  work,
  stageTitle,
  subjectTitle,
  isOpen,
  onToggle,
}: PhaseEntryViewProps) {
  const { run } = useRunActivity()
  const look = useWorkStatusLook(work.status)
  const words = useWorkWords(work, run)
  const view = useView()
  const title =
    view === 'user'
      ? [stageTitle, subjectTitle].filter((part) => part !== null).join(': ')
      : `${work.nodes.join(', ')}${subjectTitle === null ? '' : `: ${subjectTitle}`}`

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-label={activityChatMessages.showDetails}
      onClick={onToggle}
      className="group/phase flex w-fit max-w-full min-w-0 cursor-pointer items-center gap-1 rounded-md text-left text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <TraceLine {...(look.traceStatus === 'running' && { status: 'running' as const })}>
        <TraceTitle>{title}</TraceTitle>
        <TraceDescription className="flex flex-wrap gap-x-2">
          {[words.continued, words.status, words.round, words.took, words.writes, ...words.details]
            .filter((part): part is string => part !== null)
            .map((part, index) => (
              <span key={index}>{part}</span>
            ))}
        </TraceDescription>
      </TraceLine>
      <TraceIcon className="transition-transform group-aria-expanded/phase:rotate-90">
        <ChevronRightIcon />
      </TraceIcon>
    </button>
  )
}
