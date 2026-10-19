// The hooks that read the workflow: the stages that name where a run is.

import { useQuery } from '@tanstack/react-query'

import { listWorkflowStages } from '../workflow.api'
import { workflowKeys } from '../workflow.keys'

/**
 * The label of each stage of a version of the workflow, by its key, so that a run reads with the
 * version it runs; a version does not change once it exists. Idle until a version is given.
 */
function useStageLabels(version: number | undefined) {
  return useQuery({
    queryKey: workflowKeys.stages(version ?? 0),
    queryFn: () => listWorkflowStages(version ?? 0),
    enabled: version !== undefined,
    staleTime: Infinity,
    select: (stages) => new Map(stages.map(({ key, label }) => [key, label])),
  })
}

/**
 * The label of a stage in a version of the workflow. Undefined without a version or a stage, and
 * while the labels load; they load only once a version is given.
 */
export function useStageLabel(
  version: number | undefined,
  stage: string | null,
): string | undefined {
  const labels = useStageLabels(version)

  return stage === null ? undefined : labels.data?.get(stage)
}
