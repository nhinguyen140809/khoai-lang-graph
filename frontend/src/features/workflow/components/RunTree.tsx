'use client'

import { ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { RouteParam, runHref } from '@/shared/config/routes.utils'
import { runStatusLabels, runStatusTones } from '@/shared/config/run-status.constants'
import { toneClasses } from '@/shared/lib/tone.constants'
import { cn } from '@/shared/lib/utils'

import { useProjectRuns } from '../hooks/useProjectRuns'
import { useRunSteps } from '../hooks/useRunSteps'
import { isActive } from '../run-status.utils'
import { groupSteps } from '../step-groups.utils'
import type { WorkflowRun, WorkflowStep } from '../workflow.types'

const rowClassName =
  'flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-xs outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 aria-[current=page]:bg-sidebar-accent'

interface RunTreeProps {
  projectId: string
}

/** The runs of a project, newest first, each opening into its steps. */
export function RunTree({ projectId }: RunTreeProps) {
  const runs = useProjectRuns(projectId)

  if (runs.isPending) {
    return <LoadingState label="Loading runs" rows={4} size="compact" className="px-3" />
  }
  if (runs.isError) {
    return (
      <ErrorState
        message={runs.error.message}
        onRetry={() => void runs.refetch()}
        size="compact"
        className="px-3"
      />
    )
  }
  if (runs.data.length === 0) {
    return <EmptyState title="No runs yet" size="compact" className="px-3" />
  }

  return (
    <ul aria-label="Runs" className="flex flex-col gap-px px-1 pb-2">
      {runs.data.map((run) => (
        <RunNode key={run.id} projectId={projectId} run={run} />
      ))}
    </ul>
  )
}

function RunNode({ projectId, run }: { projectId: string; run: WorkflowRun }) {
  const pathname = usePathname()
  const href = runHref(projectId, run.id)
  const [open, setOpen] = useState(pathname === href)

  return (
    <li>
      <div className="flex items-center">
        <button
          type="button"
          aria-label={`${open ? 'Close' : 'Open'} Run ${String(run.number)}`}
          aria-expanded={open}
          onClick={() => {
            setOpen(!open)
          }}
          className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ChevronRightIcon
            aria-hidden
            className={cn('size-3.5 transition-transform', open && 'rotate-90')}
          />
        </button>
        <Link
          href={href}
          aria-current={pathname === href ? 'page' : undefined}
          className={cn(rowClassName, 'flex-1 font-medium text-foreground')}
        >
          <span
            aria-hidden
            className={cn(
              'size-2 shrink-0 rounded-full bg-(--tone-strong)',
              toneClasses[runStatusTones[run.status]],
            )}
          />
          <span>Run {run.number}</span>
          <span className="ml-auto truncate font-normal text-muted-foreground">
            {runStatusLabels[run.status]}
          </span>
        </Link>
      </div>
      {open && <RunSteps projectId={projectId} run={run} />}
    </li>
  )
}

function RunSteps({ projectId, run }: { projectId: string; run: WorkflowRun }) {
  const steps = useRunSteps(run.id, isActive(run.status))

  if (steps.isPending) {
    return <LoadingState label="Loading steps" rows={3} size="compact" className="pl-6" />
  }
  if (steps.isError) {
    return (
      <ErrorState
        message={steps.error.message}
        onRetry={() => void steps.refetch()}
        size="compact"
        className="pl-6"
      />
    )
  }

  return (
    <ol aria-label={`Steps of Run ${String(run.number)}`} className="pb-1 pl-5">
      {groupSteps(steps.data).map((entry) =>
        entry.type === 'step' ? (
          <li key={entry.step.id}>
            <StepRow projectId={projectId} runId={run.id} step={entry.step} />
          </li>
        ) : (
          <GroupRow
            key={entry.steps[0]?.id}
            projectId={projectId}
            runId={run.id}
            steps={entry.steps}
            subject={entry.key}
          />
        ),
      )}
    </ol>
  )
}

const stepMarks = {
  running: '...',
  succeeded: 'done',
  failed: 'failed',
  skipped: 'skipped',
} as const

function StepRow({
  projectId,
  runId,
  step,
}: {
  projectId: string
  runId: string
  step: WorkflowStep
}) {
  const selected = useSearchParams().get(RouteParam.Step) === step.id
  const pathname = usePathname()
  return (
    <Link
      href={runHref(projectId, runId, step.id)}
      aria-current={selected && pathname === runHref(projectId, runId) ? 'page' : undefined}
      className={cn(rowClassName, 'gap-2 font-mono')}
    >
      <span className="w-6 shrink-0 text-right text-muted-foreground">{step.sequence}</span>
      <span className="truncate">{step.node}</span>
      <span
        className={cn(
          'ml-auto shrink-0',
          step.status === 'failed' ? 'text-destructive-strong' : 'text-muted-foreground',
        )}
      >
        {stepMarks[step.status]}
      </span>
    </Link>
  )
}

function GroupRow({
  projectId,
  runId,
  steps,
  subject,
}: {
  projectId: string
  runId: string
  steps: WorkflowStep[]
  subject: string
}) {
  const [open, setOpen] = useState(false)
  const first = steps[0]
  const last = steps.at(-1)
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open)
        }}
        className={cn(rowClassName, 'w-full gap-1 font-mono')}
      >
        <ChevronRightIcon
          aria-hidden
          className={cn('size-3 shrink-0 transition-transform', open && 'rotate-90')}
        />
        <span className="text-muted-foreground">
          {first?.sequence}-{last?.sequence}
        </span>
        <span className="truncate">{subject}</span>
      </button>
      {open && (
        <ol className="pl-4">
          {steps.map((step) => (
            <li key={step.id}>
              <StepRow projectId={projectId} runId={runId} step={step} />
            </li>
          ))}
        </ol>
      )}
    </li>
  )
}
