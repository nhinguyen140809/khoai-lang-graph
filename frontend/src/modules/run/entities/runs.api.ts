import { HttpHeader, HttpMethod, MediaType } from '@/shared/api/http'
import { apiUrl } from '@/shared/api/request'

import { type CreateRunResponse, createRunResponseSchema } from './types/runs.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** Starts a run of a thread with an input, and gives the id of the run. */
export async function createRun(threadId: string, input: string): Promise<CreateRunResponse> {
  const response = await fetch(apiUrl(`/api/v1/threads/${encodeURIComponent(threadId)}/runs`), {
    method: HttpMethod.Post,
    headers: { [HttpHeader.ContentType]: MediaType.Json },
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
