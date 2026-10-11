'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import { useProjectRuns } from '../hooks/useProjectRuns'
import { useRetryFromStep } from '../hooks/useRetryFromStep'
import type { WorkflowDefinition, WorkflowRun, WorkflowStep } from '../workflow.types'
import { isActive, runHref } from '../workflow-links.utils'

const traceUrl = process.env.NEXT_PUBLIC_TRACE_URL

interface StepPanelProps {
  projectId: string
  run: WorkflowRun
  definition: WorkflowDefinition
  /** The step on screen; null when the node on screen was not reached. */
  step: WorkflowStep | null
  /** The node on screen, when no step is. */
  nodeLabel: string | null
}

const dash = '-'

/** Under the graph: one step, with what it cost, what it made, and what can be done with it. */
export function StepPanel({ projectId, run, definition, step, nodeLabel }: StepPanelProps) {
  const router = useRouter()
  const retry = useRetryFromStep()
  const runs = useProjectRuns(projectId)

  if (step === null) {
    return (
      <p className="p-4 text-xs text-muted-foreground">
        {nodeLabel === null
          ? 'Choose a node of the graph, or a step in the side panel.'
          : `${nodeLabel} was not reached in this run.`}
      </p>
    )
  }

  const stage = definition.stages.find(({ key }) => key === step.stage)?.label ?? step.stage
  const role =
    step.agent_role === null
      ? null
      : (definition.agent_roles.find(({ key }) => key === step.agent_role)?.label ??
        step.agent_role)
  const waiting =
    step.status === 'running' && run.status === 'interrupted' && step.agent_role === null
  // A thread has one unfinished run at a time, so a run cannot be repeated while another goes on.
  const unfinished =
    isActive(run.status) || runs.data?.some(({ status }) => isActive(status)) === true

  return (
    <section aria-label="Chosen step" className="flex flex-col gap-3 p-4 text-xs">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono">
        <span className="font-medium">STEP {step.sequence}</span>
        <span>{step.node}</span>
        <span className="text-muted-foreground">{step.stage}</span>
        <span className="text-muted-foreground">iter {step.iteration}</span>
        {waiting && <span className="text-warning-strong">waiting for review</span>}
      </header>

      <dl className="grid grid-cols-[7rem_1fr_7rem_1fr] gap-x-3 gap-y-1">
        <dt className="text-muted-foreground">Stage</dt>
        <dd>{stage}</dd>
        <dt className="text-muted-foreground">Agent</dt>
        <dd>{role ?? dash}</dd>
        <dt className="text-muted-foreground">Model</dt>
        <dd className="font-mono">{step.model_id ?? dash}</dd>
        <dt className="text-muted-foreground">Calls</dt>
        <dd>{step.llm_calls}</dd>
        <dt className="text-muted-foreground">Tokens</dt>
        <dd>
          {step.usage.input_tokens.toLocaleString('en-US')} in,{' '}
          {step.usage.output_tokens.toLocaleString('en-US')} out
        </dd>
        <dt className="text-muted-foreground">Cost</dt>
        <dd>${step.usage.cost_usd.toFixed(3)}</dd>
        <dt className="text-muted-foreground">Duration</dt>
        <dd>{(step.usage.duration_ms / 1000).toFixed(1)} s</dd>
        <dt className="text-muted-foreground">Status</dt>
        <dd>{step.status}</dd>
      </dl>

      {step.error !== null && (
        <p role="alert" className="text-destructive-strong">
          {step.error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground">Items made or changed</span>
        {step.produced.length === 0 ? (
          <span>{dash}</span>
        ) : (
          <ul className="flex flex-wrap gap-x-3 gap-y-1 font-mono">
            {step.produced.map((item) => (
              <li key={item.item_id}>
                <Link
                  href={
                    `/projects/${encodeURIComponent(projectId)}/artifacts/items/${encodeURIComponent(item.item_id)}` as Route
                  }
                  className="rounded-sm text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {item.key}
                </Link>{' '}
                <span className="text-muted-foreground">v{item.version}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-2">
        {waiting && (
          <Button asChild size="xs">
            <Link
              href={
                `/projects/${encodeURIComponent(projectId)}/review/${encodeURIComponent(run.id)}` as Route
              }
            >
              Open review
            </Link>
          </Button>
        )}
        <Button
          size="xs"
          variant="outline"
          disabled={unfinished || retry.isPending}
          title={
            unfinished
              ? 'A run of this project has not ended, so no run can be started.'
              : undefined
          }
          onClick={() => {
            retry.mutate(
              { runId: run.id, stepId: step.id },
              {
                onSuccess: (started) => {
                  router.push(runHref(projectId, started.id) as Route)
                },
                onError: (error) => {
                  toast.error(error.message)
                },
              },
            )
          }}
        >
          {retry.isPending && <Spinner className="size-3" />}
          Retry from this step
        </Button>
        {run.trace_id !== null &&
          (traceUrl === undefined ? (
            <span className="font-mono text-muted-foreground">trace {run.trace_id}</span>
          ) : (
            <Button asChild size="xs" variant="ghost">
              <a href={`${traceUrl}/${run.trace_id}`} target="_blank" rel="noreferrer">
                Open the trace
              </a>
            </Button>
          ))}
      </footer>
    </section>
  )
}
