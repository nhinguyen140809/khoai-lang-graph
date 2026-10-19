import { apiCommand, fetchPage } from '@/shared/api/api-fetch.utils'
import { apiUrl } from '@/shared/api/api-url.utils'

import {
  type CreateRunResponse,
  createRunResponseSchema,
  type Run,
  runSchema,
} from './types/runs.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/**
 * The latest run of a thread, which is its unfinished run when it has one, since a run starts only
 * after the one before it ended. Null before the first run.
 */
export async function getLatestRun(threadId: string): Promise<Run | null> {
  const page = await fetchPage(`/api/v1/threads/${encodeURIComponent(threadId)}/runs`, runSchema, {
    limit: 1,
    cursor: null,
    action: 'load the run',
  })
  return page.items[0] ?? null
}

/** Stops a run that has not finished; the step in progress is lost. */
export function cancelRun(runId: string): Promise<void> {
  return apiCommand(`/api/v1/runs/${encodeURIComponent(runId)}/cancel`, {
    action: 'stop the run',
    method: 'POST',
  })
}

/** The address of the event stream of a run, from the event after `afterEventId`. */
export function runEventsUrl(runId: string, afterEventId: number): string {
  return apiUrl(`/api/v1/runs/${encodeURIComponent(runId)}/stream?after=${String(afterEventId)}`)
}

/** Starts a run of a thread with an input, and gives the id of the run. */
export async function createRun(threadId: string, input: string): Promise<CreateRunResponse> {
  const response = await fetch(apiUrl(`/api/v1/threads/${encodeURIComponent(threadId)}/runs`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  })
  if (!response.ok) {
    throw new Error(`Failed to create run (HTTP ${String(response.status)})`)
  }
  return createRunResponseSchema.parse(await response.json())
}

/** The address of the event stream of a run, from its first event. */
export function runStreamUrl(runId: string): string {
  return apiUrl(`/api/v1/runs/${encodeURIComponent(runId)}/stream`)
}
