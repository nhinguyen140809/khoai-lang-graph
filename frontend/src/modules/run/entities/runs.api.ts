import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { apiRequest, apiUrl } from '@/shared/api/request'

import { type CreateRunResponse, createRunResponseSchema } from './types/runs.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** Starts a run of a thread with an input, and gives the id of the run. */
export function createRun(threadId: string, input: string): Promise<CreateRunResponse> {
  return apiRequest(apiEndpoints.threadRuns.path({ threadId }), createRunResponseSchema, {
    action: 'create the run',
    method: HttpMethod.Post,
    body: { input },
  })
}

/** The address of the event stream of a run, from its first event. */
export function runStreamUrl(runId: string): string {
  return apiUrl(apiEndpoints.runStream.path({ runId }))
}
