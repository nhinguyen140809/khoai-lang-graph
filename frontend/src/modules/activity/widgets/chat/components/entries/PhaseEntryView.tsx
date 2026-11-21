'use client'

import { ChevronRightIcon } from 'lucide-react'

import type { WorkEntry } from '@/modules/run/entities'
import { useWorkStatusLook, useWorkWords, workMoodOf } from '@/modules/run/entities'
import { Shimmer } from '@/shared/components/animation'
import { Face } from '@/shared/components/face'
import { Marker } from '@/shared/components/ui/marker'
import { TraceDescription, TraceIcon, TraceLine, TraceTitle } from '@/shared/components/ui/trace'

import { activityChatMessages } from '../../activity-chat.constants'
import { useRunActivity } from '../../hooks/useRunActivity'

interface PhaseEntryViewProps {
  work: WorkEntry
  stageTitle: string
  subjectTitle: string | null
  isOpen: boolean
  onToggle: () => void
}

/**
 * The separator of a phase of work: the face of the agent that did it, in the mood of its status,
 * its title and, in words, how it went. It opens and closes the items under it. Its title shimmers in the yellow of the secondary tone, crossed by a band of the foreground,
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
  const title = subjectTitle === null ? stageTitle : `${stageTitle}: ${subjectTitle}`

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
          <Face seed={work.agentRole} size="sm" mood={workMoodOf(work)} />
          <TraceTitle className="text-accent-foreground">
            <Shimmer color="secondary" variant="solid" isActive={look.traceStatus === 'running'}>
              {title}
            </Shimmer>
          </TraceTitle>
          <TraceDescription className="flex flex-wrap gap-x-2">
            {[words.continued, words.status, words.round, words.took, words.writes]
              .filter((part): part is string => part !== null)
              .map((part) => (
                <span key={part}>{part}</span>
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
