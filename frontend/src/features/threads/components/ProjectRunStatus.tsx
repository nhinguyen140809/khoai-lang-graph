'use client'

import Link from 'next/link'

import { Separator } from '@/shared/components/ui/separator'
import { Spinner } from '@/shared/components/ui/spinner'
import { routes } from '@/shared/config/routes'
import { runStatusLabels, runStatusTones } from '@/shared/config/run-status.constants'
import { toneClasses } from '@/shared/lib/tone.constants'
import { cn } from '@/shared/lib/utils'

import { useProjectRunStatus } from '../hooks/useProjectRunStatus'
import { formatCost } from '../run-status.utils'

interface ProjectRunStatusProps {
  projectId: string
}

const separator = <Separator orientation="vertical" className="h-3" />

/**
 * The run of the project in the status bar: its state, stage, latest step, cost against its
 * limit, and workflow version. A click opens the run in Workflow.
 */
export function ProjectRunStatus({ projectId }: ProjectRunStatusProps) {
  const status = useProjectRunStatus(projectId)

  switch (status.state) {
    case 'loading':
      return (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Spinner className="size-3" aria-label="Loading the run" />
          Loading the run
        </span>
      )
    case 'error':
      return (
        <span role="alert" className="flex min-w-0 items-center gap-2 text-destructive-strong">
          <span className="truncate">{status.message}</span>
          <button
            type="button"
            onClick={status.retry}
            className="shrink-0 rounded-sm underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Try again
          </button>
        </span>
      )
    case 'empty':
      return <span className="text-muted-foreground">No runs yet</span>
    case 'ready': {
      const { run } = status
      const maxCost = run.run_config.max_cost_usd
      return (
        <Link
          href={routes.project(projectId).run(run.id)}
          title={run.error?.message}
          className="flex min-w-0 items-center gap-2 rounded-sm px-1 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="flex shrink-0 items-center gap-1.5">
            <span
              aria-hidden
              className={cn(
                'size-2 rounded-full bg-(--tone-strong)',
                toneClasses[runStatusTones[run.status]],
              )}
            />
            Run {run.number}: {runStatusLabels[run.status]}
          </span>
          {separator}
          <span className="truncate font-mono">{run.current_stage}</span>
          {run.step_count > 0 && (
            <>
              {separator}
              <span className="shrink-0">step {run.step_count}</span>
            </>
          )}
          {separator}
          <span className="shrink-0">
            {formatCost(run.usage.cost_usd)}
            {maxCost === null ? ' (no limit)' : ` of ${formatCost(maxCost)}`}
          </span>
          {separator}
          <span className="shrink-0">workflow v{run.workflow_version}</span>
        </Link>
      )
    }
  }
}
