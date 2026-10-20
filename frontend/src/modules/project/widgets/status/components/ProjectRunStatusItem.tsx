'use client'

import { SquareIcon } from 'lucide-react'
import { useMemo } from 'react'

import { ProjectRunStreams, shownRun, useProjectRun } from '@/modules/project/entities'
import { stoppableRun, stopRunMessages, useStopRunDialog } from '@/modules/run/features/stop'
import { StatusBarSide, useCommands, useStatusBarItem } from '@/shared/components/frame'

import { ProjectRunStatus } from './ProjectRunStatus'

interface ProjectRunStatusItemProps {
  projectId: string
}

const COMMAND_GROUP = 'Run'

/**
 * Shows the status of the project at the left of the status bar while it is mounted, and follows
 * the runs of the project so that the status follows them. It also offers Stop run in the palette,
 * which opens the dialog of Stop beside the status. It renders nothing in place.
 */
export function ProjectRunStatusItem({ projectId }: ProjectRunStatusItemProps) {
  const content = useMemo(() => <ProjectRunStatus projectId={projectId} />, [projectId])

  useStatusBarItem({ side: StatusBarSide.Left, content })

  return (
    <>
      <ProjectRunStreams projectId={projectId} />
      <StopRunCommand projectId={projectId} />
    </>
  )
}

/**
 * Registers Stop run in the palette while the run that the status shows has not finished. It opens
 * the dialog of Stop, beside the status.
 */
function StopRunCommand({ projectId }: ProjectRunStatusItemProps) {
  const run = stoppableRun(shownRun(useProjectRun(projectId)))
  const { ask } = useStopRunDialog()

  useCommands(
    run === null
      ? []
      : [
          {
            id: 'run.stop',
            label: stopRunMessages.stopRun,
            group: COMMAND_GROUP,
            icon: <SquareIcon />,
            variant: 'destructive',
            run: () => {
              ask(run.id)
            },
          },
        ],
  )

  return null
}
