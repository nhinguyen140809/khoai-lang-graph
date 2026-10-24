import { z } from 'zod'

import { apiRequest } from '@/shared/api/request/api-fetch.utils'
import { apiUrl } from '@/shared/api/request/api-url.utils'

import { createdThreadSchema, sentMessageSchema, type Thread, threadSchema } from './threads.types'

// The first page of the threads; later pages are not read.
const listThreadsResponseSchema = z.object({ items: z.array(threadSchema) })

// TODO: switch to the generated client in src/shared/api/generated/ once the threads API exists.
export async function listThreads(): Promise<Thread[]> {
  const response = await fetch(apiUrl('/api/v1/threads'))
  if (!response.ok) {
    throw new Error(`Failed to load threads (HTTP ${String(response.status)})`)
  }
  return listThreadsResponseSchema.parse(await response.json()).items
}

/**
 * Sends the idea of a new project as the first message of a new thread, which starts its first
 * run. The message goes with `idempotencyKey`, so that sending it again starts no second run.
 */
export async function sendFirstMessage(
  projectId: string,
  content: string,
  idempotencyKey: string,
): Promise<void> {
  const thread = await apiRequest(
    `/api/v1/projects/${encodeURIComponent(projectId)}/threads`,
    createdThreadSchema,
    { action: 'start a thread', method: 'POST', body: {} },
  )
  await apiRequest(`/api/v1/threads/${encodeURIComponent(thread.id)}/messages`, sentMessageSchema, {
    action: 'send the idea',
    method: 'POST',
    body: { content },
    idempotencyKey,
  })
}
