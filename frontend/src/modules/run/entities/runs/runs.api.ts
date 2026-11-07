import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { apiCommand, apiRequest, fetchPage, type ListPage } from '@/shared/api/request'

import { type Run, runSchema } from './runs.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** One page of the runs of a thread, the newest first. */
export function listThreadRuns(
  threadId: string,
  cursor: string | null,
  limit: number,
): Promise<ListPage<Run>> {
  return fetchPage(apiEndpoints.threadRuns.path({ threadId }), runSchema, {
    limit,
    cursor,
    action: 'load the runs',
  })
}

/** The newest run of a thread, or null for a thread that has none. */
export async function findLatestRun(threadId: string): Promise<Run | null> {
  const { items } = await listThreadRuns(threadId, null, 1)
  return items[0] ?? null
}

/** One run, with its status, its stage and its usage. */
export function getRun(runId: string): Promise<Run> {
  return apiRequest(apiEndpoints.run.path({ runId }), runSchema, { action: 'load the run' })
}

/** Stops a run that has not ended; the run is read again to see it stopped. */
export function cancelRun(runId: string): Promise<void> {
  return apiCommand(apiEndpoints.runCancel.path({ runId }), {
    action: 'stop the run',
    method: HttpMethod.Post,
  })
}

/**
 * Starts a new run from a step of a run: the steps before it are not run again. The request goes
 * with `idempotencyKey`, so that sending it again starts no second run.
 */
export function retryRun(runId: string, fromStepId: string, idempotencyKey: string): Promise<Run> {
  return apiRequest(apiEndpoints.runRetry.path({ runId }), runSchema, {
    action: 'retry the run',
    method: HttpMethod.Post,
    body: { from_step_id: fromStepId },
    idempotencyKey,
  })
}
