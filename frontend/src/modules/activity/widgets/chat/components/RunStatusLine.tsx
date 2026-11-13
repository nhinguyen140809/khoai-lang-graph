'use client'

import { cn } from 'cn'

import type { Run } from '@/modules/run/entities'
import { useRunStageTitle, useRunStatusLook } from '@/modules/run/entities'
import { Shimmer } from '@/shared/components/animation'
import { toneClasses } from '@/shared/lib/tone'

import { runStatusLineStatuses } from '../activity-chat.constants'

/**
 * The last line of a run that has not ended: what it is doing now, so that the reader at the end
 * of the chat always sees whether the work goes on, whatever came between its lines. It names the
 * status and, when the stage is one the reader sees, its title; the words shimmer in the yellow of
 * the charts. A run that waits for the user, has ended or failed shows none: its review, its
 * answer and its failure are the last things the chat shows.
 */
export function RunStatusLine({ run }: { run: Run }) {
  const look = useRunStatusLook(run.status)
  const stageTitle = useRunStageTitle(run)

  if (!runStatusLineStatuses.includes(run.status)) return null

  const Mark = look.icon
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-2 px-1 pt-4 text-sm text-muted-foreground',
        toneClasses.chart,
      )}
    >
      <Mark aria-hidden className="size-4 shrink-0 text-(--tone-strong)" />
      <Shimmer color="chart">
        {stageTitle === undefined ? look.label : `${look.label}: ${stageTitle}`}
      </Shimmer>
    </p>
  )
}
