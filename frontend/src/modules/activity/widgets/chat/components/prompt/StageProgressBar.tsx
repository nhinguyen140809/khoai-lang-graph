'use client'

import {
  isStageStatusInProgress,
  type Run,
  stageNowOf,
  type StageProgress,
  useStageProgress,
  useStageStatusLook,
} from '@/modules/run/entities'
import { SegmentedProgress, SegmentedProgressItem } from '@/shared/components/ui/segmented-progress'

import { activityChatMessages } from '../../activity-chat.constants'

/**
 * The progress of the work as a bar of one segment for each stage of the workflow, without a
 * word: a stage that has begun takes the color of its status, one that has not stays quiet. It
 * shows nothing until the stages load, and when there are none. While there is room, hovering a
 * segment names its stage and its status; in a narrow place the bar is one line, and hovering it
 * names the stage that the work is at.
 */
export function StageProgressBar({ run, projectId }: { run: Run | null; projectId: string }) {
  const progress = useStageProgress(run, projectId)
  const stages = progress.state === 'success' ? progress.stages : []
  const current = stageNowOf(stages)
  // The line that names the stage now, which the bar shows on hover when it is one line.
  const currentLook = useStageStatusLook(current?.status ?? 'not_started')
  if (current === undefined) return null

  return (
    // The row under the prompt is as tall as the bar: the padding above the line makes up for the
    // space under the row, so that the line sits as far from the prompt as from the foot of the page.
    <SegmentedProgress
      label={activityChatMessages.progress}
      currentLabel={`${current.title}, ${currentLook.label}`}
      className="h-7 w-72 max-w-full pt-1"
    >
      {stages.map((stage) => (
        <Segment key={stage.key} stage={stage} />
      ))}
    </SegmentedProgress>
  )
}

function Segment({ stage }: { stage: StageProgress }) {
  const look = useStageStatusLook(stage.status)

  return (
    <SegmentedProgressItem
      label={`${stage.title}, ${look.label}`}
      tone={look.tone}
      isQuiet={look.isNotStarted}
      isLive={isStageStatusInProgress(stage.status)}
    />
  )
}
