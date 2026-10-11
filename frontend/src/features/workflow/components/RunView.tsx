'use client'

import Link from 'next/link'

import { featureTabGroup } from '@/components/layout/activity-bar.config'
import { useEditorTab } from '@/components/layout/hooks/useEditorTab'
import { EmptyState, ErrorState, LoadingState, NotFoundState } from '@/components/state'
import { Badge } from '@/components/ui/badge'
import { isNotFoundError } from '@/lib/api-fetch.utils'
import { runStatusLabels, runStatusTones } from '@/lib/run-status.constants'
import { cn } from '@/lib/utils'

import { useRun } from '../hooks/useRun'
import { useRunSteps } from '../hooks/useRunSteps'
import { formatCost, formatStepDuration } from '../workflow.utils'

interface RunViewProps {
  projectId: string
  runId: string
}

const stepMark = {
  running: '…',
  succeeded: '',
  failed: '✖',
  skipped: '-',
} as const

/**
 * The run in the editor: its header (state, stage, cost, limits), the error it
 * ended with, then the timeline of its steps in the terminal style of Chat —
 * `⏺ node` per step, the items it produced as chips under it.
 */
export function RunView({ projectId, runId }: RunViewProps) {
  const run = useRun(runId)
  const steps = useRunSteps(runId)

  useEditorTab(featureTabGroup(projectId, 'workflow'), {
    id: runId,
    title: run.data ? `Run ${String(run.data.number)}` : 'Run',
    href: `/projects/${encodeURIComponent(projectId)}/workflow/${encodeURIComponent(runId)}`,
    icon: 'run',
  })

  if (run.isPending) {
    return <LoadingState label="Loading the run" className="p-6" />
  }
  if (run.isError) {
    if (isNotFoundError(run.error)) {
      return <NotFoundState title="Run not found" description="It may belong to another project." />
    }
    return (
      <ErrorState message={run.error.message} onRetry={() => void run.refetch()} className="p-6" />
    )
  }

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-5 p-6">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">Run {run.data.number}</h1>
        <Badge variant="soft" color={runStatusTones[run.data.status]}>
          {runStatusLabels[run.data.status]}
        </Badge>
        <Badge variant="outline" className="font-mono">
          {run.data.current_stage || '-'}
        </Badge>
        <span className="text-sm text-muted-foreground">
          step {String(run.data.step_count)} · {formatCost(run.data.usage.cost_usd)}
          {run.data.run_config.max_cost_usd === null
            ? ' (no limit)'
            : ` of ${formatCost(run.data.run_config.max_cost_usd)}`}{' '}
          · workflow v{String(run.data.workflow_version)}
        </span>
      </header>

      {run.data.error ? (
        <p role="alert" className="font-mono text-sm text-destructive-strong">
          ✖ {run.data.error.code}: {run.data.error.message} [{run.data.error.stage}]
        </p>
      ) : null}

      {steps.isPending ? (
        <LoadingState label="Loading the steps" rows={6} />
      ) : steps.isError ? (
        <ErrorState message={steps.error.message} onRetry={() => void steps.refetch()} />
      ) : steps.data.length === 0 ? (
        <EmptyState title="This run has no steps" size="compact" />
      ) : (
        <ol className="flex flex-col gap-1 font-mono text-sm" aria-label="Steps of the run">
          {steps.data.map((step) => (
            <li key={step.id} className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span aria-hidden className="whitespace-nowrap text-primary">
                  ⏺ {step.node}
                </span>
                {stepMark[step.status] === '' ? null : (
                  <span
                    role="status"
                    className={cn(
                      'text-[0.8125rem]',
                      step.status === 'failed'
                        ? 'text-destructive-strong'
                        : 'text-muted-foreground',
                    )}
                  >
                    {stepMark[step.status]}
                  </span>
                )}
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {formatStepDuration(step.started_at, step.finished_at)}
                </span>
              </div>
              {step.produced.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pl-4">
                  {step.produced.map((ref) => (
                    <Link
                      key={`${ref.item_id}-${ref.key}-${String(ref.version)}`}
                      href={`/projects/${encodeURIComponent(projectId)}/search/${encodeURIComponent(ref.item_id)}`}
                      className="rounded-sm bg-sidebar-accent px-1.5 py-0.5 text-xs text-sidebar-accent-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      {ref.key}
                    </Link>
                  ))}
                </div>
              ) : null}
              {step.error ? (
                <p className="pl-4 text-xs text-destructive-strong">{step.error}</p>
              ) : null}
            </li>
          ))}
          <li aria-hidden className="flex items-center gap-2 pt-2 text-primary">
            ✓ {runStatusLabels[run.data.status]}
          </li>
        </ol>
      )}
    </article>
  )
}
