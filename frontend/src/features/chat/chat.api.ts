import { apiRequest, fetchAllPages } from '@/lib/api-fetch.utils'
import { apiUrl } from '@/lib/api-url.utils'

import { chatThreadIdSchema, type CreateRunResponse, createRunResponseSchema } from './chat.types'

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

async function createThread(projectId: string): Promise<string> {
  const thread = await apiRequest(
    `/api/v1/projects/${encodeURIComponent(projectId)}/threads`,
    chatThreadIdSchema,
    { action: 'create the conversation thread', method: 'POST', body: {} },
  )
  return thread.id
}

/**
 * The id of the thread that holds the conversation of the project: the thread that exists, or an
 * empty one created on the first visit. The chat feature reads the thread endpoints itself,
 * because a feature may not import another one; a project has one conversation, so the first
 * thread is the one.
 */
export async function getChatThreadId(projectId: string): Promise<string> {
  const threads = await fetchAllPages(
    `/api/v1/projects/${encodeURIComponent(projectId)}/threads`,
    chatThreadIdSchema,
    'load the conversation',
  )
  const existing = threads.at(0)
  return existing === undefined ? createThread(projectId) : existing.id
}
