import { apiRequest, fetchAllPages } from '@/lib/api-fetch.utils'

import type { Run, RunStep } from './workflow.types'
import { runSchema, runStepSchema, threadIdSchema } from './workflow.types'

// TODO: switch to the generated client in src/api/generated/ once it is generated.

/** The conversation thread of the project; a project has one. */
export async function conversationThreadId(projectId: string): Promise<string> {
  const threads = await fetchAllPages(
    `/api/v1/projects/${encodeURIComponent(projectId)}/threads`,
    threadIdSchema,
    'load the conversation',
  )
  return threads[0]?.id ?? ''
}

/** The runs of the conversation thread, newest first. */
export function listThreadRuns(threadId: string): Promise<Run[]> {
  return fetchAllPages(
    `/api/v1/threads/${encodeURIComponent(threadId)}/runs`,
    runSchema,
    'load the runs',
  )
}

/** One run. */
export function getRun(runId: string): Promise<Run> {
  return apiRequest(`/api/v1/runs/${encodeURIComponent(runId)}`, runSchema, {
    action: 'load the run',
  })
}

/** The steps of a run, in order. */
export function listRunSteps(runId: string): Promise<RunStep[]> {
  return fetchAllPages(
    `/api/v1/runs/${encodeURIComponent(runId)}/steps`,
    runStepSchema,
    'load the steps of the run',
  )
}
