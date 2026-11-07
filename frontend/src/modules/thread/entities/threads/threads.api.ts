import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { apiCommand, apiRequest, fetchPage, type ListPage } from '@/shared/api/request'
import { pathWithQuery } from '@/shared/lib/url'

import { sendMessage } from '../messages/messages.api'
import {
  type CreateThreadBody,
  type Thread,
  type ThreadFilters,
  threadSchema,
  type UpdateThreadBody,
} from './threads.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** One page of the threads of a project, the newest message first. */
export function listProjectThreads(
  projectId: string,
  cursor: string | null,
  limit: number,
): Promise<ListPage<Thread>> {
  return fetchPage(apiEndpoints.projectThreads.path({ projectId }), threadSchema, {
    limit,
    cursor,
    action: 'load the threads of the project',
  })
}

/** One page of the threads of the user across projects, the newest message first. */
export function listThreads(
  cursor: string | null,
  limit: number,
  filters: ThreadFilters = {},
): Promise<ListPage<Thread>> {
  const path = pathWithQuery(apiEndpoints.threads.path(), { project_id: filters.projectId })
  return fetchPage(path, threadSchema, {
    limit,
    cursor,
    action: 'load the threads',
  })
}

/** One thread, with the status of its latest run. */
export function getThread(threadId: string): Promise<Thread> {
  return apiRequest(apiEndpoints.thread.path({ threadId }), threadSchema, {
    action: 'load the thread',
  })
}

/** Creates an empty thread in a project; its first message starts the work. */
export function createThread(projectId: string, body: CreateThreadBody = {}): Promise<Thread> {
  return apiRequest(apiEndpoints.projectThreads.path({ projectId }), threadSchema, {
    action: 'create the thread',
    method: HttpMethod.Post,
    body,
  })
}

/** Renames a thread, archives it or makes it active again. */
export function updateThread(threadId: string, body: UpdateThreadBody): Promise<Thread> {
  return apiRequest(apiEndpoints.thread.path({ threadId }), threadSchema, {
    action: 'change the thread',
    method: HttpMethod.Patch,
    body,
  })
}

/** Deletes a thread; a thread with an unfinished run answers 409 until the run is stopped. */
export function deleteThread(threadId: string): Promise<void> {
  return apiCommand(apiEndpoints.thread.path({ threadId }), {
    action: 'delete the thread',
    method: HttpMethod.Delete,
  })
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
  const thread = await createThread(projectId)
  await sendMessage(thread.id, { content }, idempotencyKey)
}
