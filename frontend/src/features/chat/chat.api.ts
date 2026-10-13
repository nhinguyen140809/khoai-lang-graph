import { apiUrl } from '@/shared/api/api-url.utils'

import { type CreateRunResponse, createRunResponseSchema } from './chat.types'

// TODO: switch to the generated client in src/api/generated/ once the backend exists.
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

export function runStreamUrl(runId: string): string {
  return apiUrl(`/api/v1/runs/${encodeURIComponent(runId)}/stream`)
}
