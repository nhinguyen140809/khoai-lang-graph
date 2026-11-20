'use client'

import { cn } from 'cn'

import type { Run } from '@/modules/run/entities'
import {
  useRunActs,
  useRunLastWork,
  useRunStageTitle,
  useRunStatusLook,
  workMoodOf,
} from '@/modules/run/entities'
import { Actor } from '@/shared/components/act'
import { Glint, Shimmer } from '@/shared/components/animation'
import { toneClasses } from '@/shared/lib/tone'

import { runStatusLineStatuses, statusLineSlots } from '../../activity-chat.constants'

/**
 * The last line of a run that has not ended: what it is doing now, so that the reader at the end
 * of the chat always sees whether the work goes on, whatever came between its lines. It names the
 * status and, when the stage is one the reader sees, its title, in yellow with a shimmering band of
 * the foreground. The agent at work stands before the words, large, with what it does drawn around
 * it: the acts of the tool that it uses, else those of its stage. When the workflow names none, it
 * has the mood of its phase, or of the status of the run between two phases. A glint stands where no
 * agent has run yet. A run that waits for the user, has ended or failed shows none: its review, its
 * answer and its failure are the last things the chat shows.
 */
export function RunStatusLine({ run }: { run: Run }) {
  const look = useRunStatusLook(run.status)
  const stageTitle = useRunStageTitle(run)
  const lastWork = useRunLastWork(run)
  const acts = useRunActs(run)
  const agentRole = lastWork?.agentRole
  // The mood of the phase at work; between two phases, the mood of the status of the run.
  const mood = lastWork?.status === 'running' ? workMoodOf(lastWork) : look.mood

  if (!runStatusLineStatuses.includes(run.status)) return null

  return (
    <div
      role="status"
      aria-live="polite"
      // What the acts draw around the face and its turning reach past the face, up to a face and a
      // half above and below it. Left to overflow, that moves the end of the scrolled chat with every
      // frame, so the line keeps that room above and below it and clips what goes past it. Nothing is
      // clipped at the sides, where the acts go left and right of the face and moving them changes
      // no height.
      className={cn(
        'flex items-center gap-12 overflow-x-visible overflow-y-clip px-1 py-9 text-sm text-muted-foreground',
        toneClasses.secondary,
      )}
    >
      {agentRole === undefined ? (
        <Glint aria-hidden variant="mesh" className="size-6" />
      ) : (
        <Actor
          seed={agentRole}
          size="xl"
          acts={acts}
          slots={statusLineSlots}
          {...(acts.length === 0 && { mood })}
        />
      )}
      <p>
        <Shimmer color="secondary" variant="solid">
          {stageTitle === undefined ? look.label : `${look.label}: ${stageTitle}`}
        </Shimmer>
      </p>
    </div>
  )
}
