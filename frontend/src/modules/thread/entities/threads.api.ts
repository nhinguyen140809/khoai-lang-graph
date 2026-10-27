import { z } from 'zod'

import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { apiRequest } from '@/shared/api/request'

import { createdThreadSchema, sentMessageSchema, type Thread, threadSchema } from './threads.types'

// The first page of the threads; later pages are not read.
const listThreadsResponseSchema = z.object({ items: z.array(threadSchema) })

// TODO: switch to the generated client in src/shared/api/generated/ once the threads API exists.
export async function listThreads(): Promise<Thread[]> {
  const { items } = await apiRequest(apiEndpoints.threads.path(), listThreadsResponseSchema, {
    action: 'load threads',
  })
  return items
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
    apiEndpoints.projectThreads.path({ projectId }),
    createdThreadSchema,
    { action: 'start a thread', method: HttpMethod.Post, body: {} },
  )
  await apiRequest(apiEndpoints.threadMessages.path({ threadId: thread.id }), sentMessageSchema, {
    action: 'send the idea',
    method: HttpMethod.Post,
    body: { content },
    idempotencyKey,
  })
}
