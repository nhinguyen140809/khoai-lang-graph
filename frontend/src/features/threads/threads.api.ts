import { apiRequest, fetchAllPages } from '@/shared/api/api-fetch.utils'

import {
  type Run,
  runSchema,
  type RunStep,
  runStepSchema,
  type Thread,
  threadSchema,
} from './threads.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** The threads of a project, newest message first. */
export function listProjectThreads(projectId: string): Promise<Thread[]> {
  return fetchAllPages(
    `/api/v1/projects/${encodeURIComponent(projectId)}/threads`,
    threadSchema,
    'load threads',
  )
}

/** The runs of a thread, newest first. */
export function listThreadRuns(threadId: string): Promise<Run[]> {
  return fetchAllPages(
    `/api/v1/threads/${encodeURIComponent(threadId)}/runs`,
    runSchema,
    'load the runs of the thread',
  )
}

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
