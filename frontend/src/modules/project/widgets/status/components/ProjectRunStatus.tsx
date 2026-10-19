'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

import { useProjectRun } from '@/modules/project/entities'
import { type Run, runStatusLabel, runStatusLook, useRunStageLabel } from '@/modules/run/entities'
import { stoppableRun, StopRunButton } from '@/modules/run/features/stop'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Spinner } from '@/shared/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { routes } from '@/shared/config/routes'
import type { Tone } from '@/shared/lib/tone'
import { useView } from '@/shared/lib/view'

import { projectRunStatusMessages } from '../project-run-status.constants'

interface ProjectRunStatusProps {
  projectId: string
}

/**
 * The status of the project: the status of the latest run of the thread that needs the user most,
 * with the label of the stage it is at, and Stop while that run has not finished. The status opens
 * the activity of that thread, which is the activity of the project while a project has one thread.
 */
export function ProjectRunStatus({ projectId }: ProjectRunStatusProps) {
  const project = useProjectRun(projectId)

  if (project.state === 'pending') {
    return (
      <div role="status" className="flex min-w-0">
        <StatusPill tone="neutral" icon={<Spinner aria-hidden />}>
          {projectRunStatusMessages.loading}
        </StatusPill>
      </div>
    )
  }

  if (project.state === 'error') {
    return (
      <div role="alert" className="flex min-w-0 items-center gap-2 text-sm text-destructive">
        <span className="truncate">{projectRunStatusMessages.failed}</span>
        <Button variant="link" size="xs" className="h-auto p-0" onClick={project.retry}>
          {projectRunStatusMessages.retry}
        </Button>
      </div>
    )
  }

  const run = stoppableRun(project.run)
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div role="status" className="flex min-w-0">
        <StatusLink projectId={projectId} run={project.run} />
      </div>
      {run !== null && <StopRunButton runId={run.id} />}
    </div>
  )
}

/** The status, which opens the activity; the tooltip of a run that failed says why. */
function StatusLink({ projectId, run }: { projectId: string; run: Run | null }) {
  const link = (
    <Link
      href={routes.project(projectId).activity()}
      className="flex min-w-0 rounded-md outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <RunStatusPill run={run} />
      <span className="sr-only">, {projectRunStatusMessages.openActivity}</span>
    </Link>
  )
  if (run?.error == null) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-80">
        {run.error.message}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * The status of a run, or Not started without one, with the label of its stage where it names it.
 * A status after which the user has to act has a solid fill.
 */
function RunStatusPill({ run }: { run: Run | null }) {
  const view = useView()
  const status = run?.status ?? null
  const stage = useRunStageLabel(status, run?.current_stage ?? null, run?.workflow_version)
  const { tone, icon: Icon, needsUser } = runStatusLook(status)

  return (
    <StatusPill tone={tone} icon={<Icon aria-hidden />} solid={needsUser}>
      <span className="font-bold">{runStatusLabel(status)[view]}</span>
      {stage !== undefined && `: ${stage}`}
    </StatusPill>
  )
}

interface StatusPillProps {
  tone: Tone
  /** A plain sign of the status, or a spinner while it loads. */
  icon: ReactNode
  /** A solid fill, for a status after which the user has to act; a soft fill otherwise. */
  solid?: boolean
  children: ReactNode
}

/**
 * A status on the status bar: a badge larger than the others, since the user reads it, with
 * corners rounded a little, since it holds a few words.
 */
function StatusPill({ tone, icon, solid = false, children }: StatusPillProps) {
  return (
    <Badge
      variant={solid ? 'solid' : 'soft'}
      color={tone}
      className="h-6 min-w-0 shrink gap-1.5 rounded-md px-2 text-sm font-normal [&>svg]:size-3.5!"
    >
      {icon}
      <span className="truncate">{children}</span>
    </Badge>
  )
}
