'use client'

import type { Route } from 'next'
import { useState } from 'react'

import { featureTabGroup } from '@/components/layout/activity-bar.config'
import { EditorWithPanel } from '@/components/layout/EditorWithPanel'
import { useEditorTab } from '@/components/layout/hooks/useEditorTab'
import { EmptyState, ErrorState, LoadingState, NotFoundState } from '@/components/state'
import { Badge } from '@/components/ui/badge'
import { isNotFoundError } from '@/lib/api-fetch.utils'
import { runStatusLabels, runStatusTones } from '@/lib/run-status.constants'

import { replaySteps } from '../graph/node-status.reducer'
import { useGraphLayout } from '../graph/run-layout.utils'
import { usePendingInterrupt } from '../hooks/usePendingInterrupt'
import { useRun } from '../hooks/useRun'
import { useRunSteps } from '../hooks/useRunSteps'
import { useWorkflowDefinition } from '../hooks/useWorkflowDefinition'
import { retryFromStep } from '../workflow.api'
import { formatCost, formatStepDuration } from '../workflow.utils'
import { WorkflowGraph } from './WorkflowGraph'

interface RunViewProps {
  projectId: string
  runId: string
}

/**
 * A run per skeletons §7: the editor shows the graph of the workflow
 * version of the run — every node with its state and its visit count, the
 * last edge taken emphasized — and the panel under it shows the steps of
 * the node clicked, with the model, the tokens, the items it produced, and
 * the actions the panel names (open the review that waits, retry from a
 * step, the trace of the run).
 */
export function RunView({ projectId, runId }: RunViewProps) {
  const run = useRun(runId)
  const steps = useRunSteps(runId)
  const interrupt = usePendingInterrupt(runId)
  const definition = useWorkflowDefinition(run.data?.workflow_version ?? null)
  const layout = useGraphLayout(
    definition.data?.nodes ?? [],
    definition.data?.edges ?? [],
    (definition.data?.stages ?? []).map((stage) => stage.key),
  )
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  useEditorTab(featureTabGroup(projectId, 'workflow'), {
    id: runId,
    title: run.data ? `Run ${String(run.data.number)}` : 'Run',
    href: `/projects/${encodeURIComponent(projectId)}/workflow/${encodeURIComponent(runId)}` as Route,
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

  const runSteps = steps.isSuccess ? steps.data : []
  const progress =
    steps.isSuccess && interrupt.isSuccess
      ? replaySteps(runSteps, (interrupt.data ?? null)?.node ?? null)
      : null
  const nodeSteps = selectedNode ? runSteps.filter((step) => step.node === selectedNode) : []

  return (
    <EditorWithPanel
      panelLabel="Steps of the node"
      panel={
        <div className="flex min-h-0 flex-col gap-2 overflow-auto px-4 py-3">
          {selectedNode === null ? (
            <p className="text-sm text-muted-foreground">
              Click a node of the graph to read its steps here.
            </p>
          ) : nodeSteps.length === 0 ? (
            <p className="text-sm text-muted-foreground">{selectedNode} did not run in this run.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {nodeSteps.map((step) => (
                <li key={step.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                  <span className="font-mono text-xs">
                    STEP {String(step.sequence)} · {step.node}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {step.stage} · iter {String(step.iteration)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {step.model_id ?? 'no model'} · {String(step.llm_calls)} call
                    {step.llm_calls === 1 ? '' : 's'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {String(step.usage.input_tokens)}+{String(step.usage.output_tokens)} tok ·{' '}
                    {formatCost(step.usage.cost_usd)}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatStepDuration(step.started_at, step.finished_at)}
                  </span>
                  {step.produced.map((ref) => (
                    <a
                      key={`${ref.item_id}-${ref.key}`}
                      href={`/projects/${encodeURIComponent(projectId)}/search/${encodeURIComponent(ref.item_id)}`}
                      className="rounded-sm bg-sidebar-accent px-1.5 py-0.5 font-mono text-xs text-sidebar-accent-foreground"
                    >
                      {ref.key}
                    </a>
                  ))}
                  {step.error !== null ? (
                    <p role="alert" className="w-full text-xs text-destructive-strong">
                      {step.error}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      void retryFromStep(runId, step.id).then(() => {
                        window.location.reload()
                      })
                    }}
                    className="w-full rounded-sm py-0.5 text-xs underline underline-offset-2 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    Retry from this step
                  </button>
                </li>
              ))}
            </ul>
          )}
          {run.data.error ? (
            <p role="alert" className="font-mono text-xs text-destructive-strong">
              ✖ {run.data.error.code}: {run.data.error.message} [{run.data.error.stage}]
            </p>
          ) : null}
          {run.data.trace_id === null ? null : (
            <p className="text-xs text-muted-foreground">
              Trace id: <span className="font-mono">{run.data.trace_id}</span>
            </p>
          )}
        </div>
      }
    >
      <div className="flex min-h-0 flex-col gap-4 p-4">
        <header className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold">Run {String(run.data.number)}</h1>
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
          {(interrupt.data ?? null) !== null ? (
            <a
              href={`/projects/${encodeURIComponent(projectId)}/chat` as Route}
              className="rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground"
            >
              Open review ({runStatusLabels[run.data.status]})
            </a>
          ) : null}
        </header>
        {definition.isSuccess && layout !== null && progress !== null ? (
          <WorkflowGraph
            nodes={definition.data.nodes}
            edges={definition.data.edges}
            progress={progress}
            steps={runSteps}
            layout={layout}
            onNodeSelect={setSelectedNode}
          />
        ) : (
          <LoadingState label="Laying out the graph" rows={5} />
        )}
        {steps.isError ? (
          <ErrorState message={steps.error.message} onRetry={() => void steps.refetch()} />
        ) : null}
        {steps.isSuccess && runSteps.length === 0 ? (
          <EmptyState title="This run has no steps" size="compact" />
        ) : null}
      </div>
    </EditorWithPanel>
  )
}
