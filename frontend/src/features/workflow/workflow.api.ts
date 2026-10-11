import { apiRequest, fetchAllPages } from '@/lib/api-fetch.utils'

import {
  threadIdSchema,
  workflowDefinitionSchema,
  workflowRunSchema,
  workflowStepSchema,
} from './workflow.types'

// TODO: switch to the generated client in src/api/generated/ once it is generated.

const id = encodeURIComponent

/** One version of the workflow definition; a past run is shown with the version it ran with. */
export function getWorkflowDefinition(version: number) {
  return apiRequest(
    `/api/v1/workflow/definition?version=${String(version)}`,
    workflowDefinitionSchema,
    { action: 'load the workflow definition' },
  )
}

/** The runs of a project, newest first. They live in the threads of the project. */
export async function listProjectRuns(projectId: string) {
  const threads = await fetchAllPages(
    `/api/v1/projects/${id(projectId)}/threads`,
    threadIdSchema,
    'load the runs',
  )
  const lists = await Promise.all(
    threads.map((entry) =>
      fetchAllPages(`/api/v1/threads/${id(entry.id)}/runs`, workflowRunSchema, 'load the runs'),
    ),
  )
  return lists.flat().toSorted((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? ''))
}

export function listRunSteps(runId: string) {
  return fetchAllPages(
    `/api/v1/runs/${id(runId)}/steps`,
    workflowStepSchema,
    'load the steps of the run',
  )
}

/** Starts a new run from a step of a run; the steps before it are not run again. */
export function retryFromStep(runId: string, stepId: string) {
  return apiRequest(`/api/v1/runs/${id(runId)}/retry`, workflowRunSchema, {
    action: 'retry the run',
    method: 'POST',
    body: { from_step_id: stepId },
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  })
}
