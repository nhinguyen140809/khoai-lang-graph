'use client'

import { cn } from 'cn'

import type { Run } from '@/modules/run/entities'
import {
  useRunLastWork,
  useRunStageTitle,
  useRunStatusLook,
  workMoodOf,
} from '@/modules/run/entities'
import { Glint, Shimmer } from '@/shared/components/animation'
import { Face } from '@/shared/components/face'
import { toneClasses } from '@/shared/lib/tone'

import { runStatusLineStatuses } from '../../activity-chat.constants'

/**
 * The last line of a run that has not ended: what it is doing now, so that the reader at the end
 * of the chat always sees whether the work goes on, whatever came between its lines. It names the
 * status and, when the stage is one the reader sees, its title; the face of the agent at work, in the mood of the status, or a glint where no agent has run yet, comes before the words, which are yellow and shimmer with a band of the foreground.
 * A run that waits for the user, has ended or failed shows none: its review, its
 * answer and its failure are the last things the chat shows.
 */
export function RunStatusLine({ run }: { run: Run }) {
  const look = useRunStatusLook(run.status)
  const stageTitle = useRunStageTitle(run)
  const lastWork = useRunLastWork(run)
  const agentRole = lastWork?.agentRole
  // The mood of the phase at work; between two phases, the mood of the status of the run.
  const mood = lastWork?.status === 'running' ? workMoodOf(lastWork) : look.mood

  if (!runStatusLineStatuses.includes(run.status)) return null

  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-2 px-1 pt-4 text-sm text-muted-foreground',
        toneClasses.secondary,
      )}
    >
      {agentRole === undefined ? (
        <Glint aria-hidden variant="mesh" className="size-6" />
      ) : (
        <Face seed={agentRole} size="sm" mood={mood} />
      )}
      <Shimmer color="secondary" variant="solid">
        {stageTitle === undefined ? look.label : `${look.label}: ${stageTitle}`}
      </Shimmer>
    </p>
  )
}
