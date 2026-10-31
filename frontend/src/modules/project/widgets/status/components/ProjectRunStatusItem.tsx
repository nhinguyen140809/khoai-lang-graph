'use client'

import { useMemo } from 'react'

import { ProjectRunStreams, shownRun, useProjectRunResult } from '@/modules/project/entities'
import { StopRunDialog, useStopRunCommand } from '@/modules/run/features/stop'
import { StatusBarSide, useStatusBarItem } from '@/shared/components/frame'

import { ProjectRunStatus } from './ProjectRunStatus'

/**
 * Shows the status of the project at the left of the status bar while it is mounted, follows the
 * runs of the project so that the status follows them, and holds the one Stop dialog, which the
 * status and the command palette open. It renders nothing in place but the dialog.
 */
export function ProjectRunStatusItem({ projectId }: { projectId: string }) {
  const content = useMemo(() => <ProjectRunStatus projectId={projectId} />, [projectId])

  useStatusBarItem({ side: StatusBarSide.Left, content })
  const projectRunResult = useProjectRunResult(projectId)
  useStopRunCommand(shownRun(projectRunResult))

  return (
    <>
      <ProjectRunStreams projectId={projectId} />
      <StopRunDialog />
    </>
  )
}
