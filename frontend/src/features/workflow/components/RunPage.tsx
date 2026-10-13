'use client'

import type { Route } from 'next'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

import { EditorWithPanel, projectTabGroup, useEditorTab } from '@/components/layout'
import { ErrorState, LoadingState, NotFoundState } from '@/components/state'
import { ScrollArea } from '@/components/ui/scroll-area'
import { runStatusLabels } from '@/lib/run-status.constants'

import { useGraphLayout } from '../hooks/useGraphLayout'
import { useProjectRuns } from '../hooks/useProjectRuns'
import { useRunSteps } from '../hooks/useRunSteps'
import { useWorkflowDefinition } from '../hooks/useWorkflowDefinition'
import { runProgress } from '../run-progress.utils'
import { WorkflowTabIcon } from '../workflow-frame.config'
import { isActive, runHref, runNodeHref } from '../workflow-links.utils'
import { StatePanel } from './StatePanel'
import { StepPanel } from './StepPanel'
import { WorkflowGraph } from './WorkflowGraph'

interface RunPageProps {
  projectId: string
  runId: string
}

/** One run: the graph of its workflow with the state of every node, and the step that is chosen. */
export function RunPage({ projectId, runId }: RunPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const runs = useProjectRuns(projectId)
  const run = runs.data?.find(({ id }) => id === runId)
  const steps = useRunSteps(runId, run !== undefined && isActive(run.status))
  const definition = useWorkflowDefinition(run?.workflow_version)
  const layout = useGraphLayout(definition.data)

  useEditorTab(
    projectTabGroup(projectId),
    run === undefined
      ? null
      : {
          id: runId,
          title: `Run ${String(run.number)}`,
          href: runHref(projectId, runId),
          icon: WorkflowTabIcon.Run,
        },
  )

  const progress = useMemo(() => runProgress(steps.data ?? [], run), [steps.data, run])

  if (runs.isPending) return <LoadingState label="Loading the run" rows={4} />
  if (runs.isError) {
    return <ErrorState message={runs.error.message} onRetry={() => void runs.refetch()} />
  }
  if (run === undefined) {
    return (
      <NotFoundState
        title="Run not found"
        description="No run of this project has this address."
        reference={runId}
      />
    )
  }
  if (definition.isError) {
    return (
      <ErrorState message={definition.error.message} onRetry={() => void definition.refetch()} />
    )
  }
  if (steps.isError) {
    return <ErrorState message={steps.error.message} onRetry={() => void steps.refetch()} />
  }
  if (layout.isError) {
    return <ErrorState message={layout.error.message} onRetry={() => void layout.refetch()} />
  }
  if (definition.data === undefined || layout.data === undefined || steps.data === undefined) {
    return <LoadingState label="Loading the graph" rows={4} />
  }

  const stepId = searchParams.get('step')
  const step = steps.data.find(({ id }) => id === stepId) ?? null
  const shownNode = step?.node ?? searchParams.get('node')
  const nodeLabel = definition.data.nodes.find(({ id }) => id === shownNode)?.label ?? shownNode

  const chooseNode = (nodeId: string) => {
    const last = progress.nodes[nodeId]?.lastStepId
    if (last === undefined || last === null) {
      router.replace(runNodeHref(projectId, runId, nodeId) as Route, { scroll: false })
      return
    }
    router.replace(runHref(projectId, runId, last) as Route, { scroll: false })
  }

  return (
    <EditorWithPanel
      panelLabel="Details"
      sections={[
        {
          id: 'step',
          title: 'Step',
          content: (
            <ScrollArea className="h-full">
              <StepPanel
                projectId={projectId}
                run={run}
                definition={definition.data}
                step={step}
                nodeLabel={step === null ? nodeLabel : null}
              />
            </ScrollArea>
          ),
        },
        {
          id: 'state',
          title: 'State',
          content: (
            <ScrollArea className="h-full">
              <StatePanel projectId={projectId} runId={runId} stepId={step?.id ?? null} active />
            </ScrollArea>
          ),
        },
      ]}
    >
      <div className="relative h-full min-h-64">
        <p className="absolute top-2 left-3 z-10 font-mono text-xs text-muted-foreground">
          Run {run.number}: {runStatusLabels[run.status]} - {run.current_stage} - workflow v
          {run.workflow_version}
        </p>
        <WorkflowGraph
          definition={definition.data}
          layout={layout.data}
          progress={progress}
          selectedNode={shownNode}
          onSelectNode={chooseNode}
        />
      </div>
    </EditorWithPanel>
  )
}
