import { apiRequest, fetchPage } from '@/shared/api/api-fetch.utils'

import { createdThreadSchema, sentMessageSchema, type Thread, threadSchema } from './threads.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

// How many threads of a project are read: the first page, since a project has one thread.
const THREAD_PAGE_SIZE = 20

/** The threads of a project, the latest message first. */
export async function listProjectThreads(projectId: string): Promise<Thread[]> {
  const page = await fetchPage(
    `/api/v1/projects/${encodeURIComponent(projectId)}/threads`,
    threadSchema,
    { limit: THREAD_PAGE_SIZE, cursor: null, action: 'load the threads' },
  )
  return page.items
}

/** Sends the idea of a new project as the first message of a new thread, which starts its first run. */
export async function sendFirstMessage(projectId: string, content: string): Promise<void> {
  const thread = await apiRequest(
    `/api/v1/projects/${encodeURIComponent(projectId)}/threads`,
    createdThreadSchema,
    { action: 'start a thread', method: 'POST', body: {} },
  )
  await apiRequest(`/api/v1/threads/${encodeURIComponent(thread.id)}/messages`, sentMessageSchema, {
    action: 'send the idea',
    method: 'POST',
    body: { content },
  })
}
