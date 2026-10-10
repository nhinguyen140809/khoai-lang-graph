'use client'

import Link from 'next/link'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { runStatusLabels, runStatusTones } from '@/lib/run-status.constants'
import { toneClasses } from '@/lib/tone.constants'
import { cn } from '@/lib/utils'

import { useProjectRunStatus } from '../hooks/useProjectRunStatus'
import { formatCost } from '../run-status.utils'
import type { Thread } from '../threads.types'
import { threadTitle } from '../threads.utils'

interface ProjectRunStatusProps {
  projectId: string
}

interface OtherRunsProps {
  projectId: string
  threads: Thread[]
}

/** A button with the count of the other unfinished runs; it lists their threads. */
function OtherRuns({ projectId, threads }: OtherRunsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="shrink-0 rounded-sm px-1 text-muted-foreground underline-offset-2 outline-none hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          +{threads.length} unfinished {threads.length === 1 ? 'run' : 'runs'}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-72 gap-1 p-1">
        <p className="px-2 py-1 text-xs font-medium">Other unfinished runs</p>
        <ul>
          {threads.map((thread) => {
            const status = thread.active_run_status
            return (
              <li key={thread.id}>
                <Link
                  href={`/projects/${encodeURIComponent(projectId)}/chat/${encodeURIComponent(thread.id)}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'size-2 shrink-0 rounded-full bg-(--tone-strong)',
                      status !== null && toneClasses[runStatusTones[status]],
                    )}
                  />
                  <span className="truncate">{threadTitle(thread)}</span>
                  <span className="ml-auto shrink-0 text-muted-foreground">
                    {status === null ? '' : runStatusLabels[status]}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
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
      const { run, others } = status
      const maxCost = run.run_config.max_cost_usd
      return (
        <>
          <Link
            href={`/projects/${encodeURIComponent(projectId)}/workflow/${encodeURIComponent(run.id)}`}
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
          {others.length > 0 && <OtherRuns projectId={projectId} threads={others} />}
        </>
      )
    }
  }
}
