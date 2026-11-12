'use client'

import { ChevronRightIcon } from 'lucide-react'

import type { WorkEntry } from '@/modules/run/entities'
import { useWorkStatusLook, useWorkWords } from '@/modules/run/entities'
import { Shimmer } from '@/shared/components/animation'
import { Marker } from '@/shared/components/ui/marker'
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
 * items under it. It carries no mark of its status: its title shimmers in the yellow of the charts
 * while it works, and the items under it, such as its failure, are where the reader looks.
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
    <Marker variant="border" asChild>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={activityChatMessages.showDetails}
        onClick={onToggle}
        className="group/phase cursor-pointer text-left transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <TraceLine>
          <TraceTitle className="text-accent-foreground">
            <Shimmer color="chart" isActive={look.traceStatus === 'running'}>
              {title}
            </Shimmer>
          </TraceTitle>
          <TraceDescription className="flex flex-wrap gap-x-2">
            {[
              words.continued,
              words.status,
              words.round,
              words.took,
              words.writes,
              ...words.details,
            ]
              .filter((part): part is string => part !== null)
              .map((part, index) => (
                <span key={index}>{part}</span>
              ))}
          </TraceDescription>
        </TraceLine>
        {/* The arrow follows the words, on the same side, and turns down while the items show. */}
        <TraceIcon className="transition-transform group-aria-expanded/phase:rotate-90">
          <ChevronRightIcon />
        </TraceIcon>
      </button>
    </Marker>
  )
}
