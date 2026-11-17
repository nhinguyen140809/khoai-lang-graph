'use client'

import { cn } from 'cn'

import {
  type Run,
  type StageProgress,
  useStageProgress,
  useStageStatusLook,
} from '@/modules/run/entities'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { toneClasses } from '@/shared/lib/tone'

import { activityChatMessages } from '../activity-chat.constants'

/**
 * The progress of the work as a bar of one segment for each stage of the workflow, without a
 * word: a stage that has begun takes the color of its status, one that has not stays quiet. It
 * shows nothing until the stages load, and when there are none. Hovering a segment names the
 * stage and its status.
 */
export function StageProgressBar({ run, projectId }: { run: Run | null; projectId: string }) {
  const progress = useStageProgress(run, projectId)
  if (progress.state !== 'success' || progress.stages.length === 0) return null

  return (
    <div
      role="group"
      aria-label={activityChatMessages.progress}
      className="flex h-7 w-56 max-w-full items-center gap-1 pt-1"
    >
      {progress.stages.map((stage) => (
        <Segment key={stage.key} stage={stage} />
      ))}
    </div>
  )
}

function Segment({ stage }: { stage: StageProgress }) {
  const look = useStageStatusLook(stage.status)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* The hit area is the height of the row. The padding above the bar makes up for the space
            under the row, so that the line sits as far from the prompt as from the foot of the page. */}
        <span className="flex h-full min-w-0 flex-1 items-center">
          <span
            className={cn(
              'h-1 w-full rounded-full bg-(--tone) transition-colors motion-reduce:transition-none',
              toneClasses[look.tone],
              look.isNotStarted && 'bg-foreground/25',
            )}
          />
          <span className="sr-only">{`${stage.title}, ${look.label}`}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{`${stage.title}, ${look.label}`}</TooltipContent>
    </Tooltip>
  )
}
