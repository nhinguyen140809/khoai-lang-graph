import { apiRequest } from '@/shared/api/api-fetch.utils'

import { type WorkflowStage, workflowStagesSchema } from './workflow.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** The stages of a version of the workflow, in order, with their labels, which name where a run is. */
export async function listWorkflowStages(version: number): Promise<WorkflowStage[]> {
  const { stages } = await apiRequest(
    `/api/v1/workflow/definition?version=${String(version)}`,
    workflowStagesSchema,
    { action: 'load the workflow' },
  )
  return stages
}
