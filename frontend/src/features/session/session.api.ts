import { apiCommand, apiRequest, fetchAllPages, listPageSchema } from '@/lib/api-fetch.utils'
import { apiUrl } from '@/lib/api-url.utils'

import {
  mentionItemSchema,
  messageSchema,
  pendingReviewSchema,
  sendMessageResponseSchema,
  type SessionRun,
  sessionRunSchema,
  sessionStepSchema,
  sessionThreadIdSchema,
} from './session.types'

// TODO: switch to the generated client in src/api/generated/ once the client is generated.

export function runStreamUrl(runId: string): string {
  return apiUrl(`/api/v1/runs/${encodeURIComponent(runId)}/stream`)
}

async function createThread(projectId: string): Promise<string> {
  const thread = await apiRequest(
    `/api/v1/projects/${encodeURIComponent(projectId)}/threads`,
    sessionThreadIdSchema,
    { action: 'create the thread of the session', method: 'POST', body: {} },
  )
  return thread.id
}

/**
 * The id of the thread that holds the session of the project: the thread that exists, or an
 * empty one created on the first visit. The session feature reads the thread endpoints itself,
 * because a feature may not import another one; a project has one session, so the first
 * thread is the one.
 */
export async function getSessionThreadId(projectId: string): Promise<string> {
  const threads = await fetchAllPages(
    `/api/v1/projects/${encodeURIComponent(projectId)}/threads`,
    sessionThreadIdSchema,
    'open the session',
  )
  const existing = threads.at(0)
  return existing === undefined ? createThread(projectId) : existing.id
}

/** The messages of the project, oldest first. */
export function listMessages(threadId: string) {
  return fetchAllPages(
    `/api/v1/threads/${encodeURIComponent(threadId)}/messages`,
    messageSchema,
    'load the messages',
  )
}

/** The runs of the project, newest first. */
export function listThreadRuns(threadId: string) {
  return fetchAllPages(
    `/api/v1/threads/${encodeURIComponent(threadId)}/runs`,
    sessionRunSchema,
    'load the runs',
  )
}

/** The steps of a run, in the order they ran. */
export function listRunSteps(runId: string) {
  return fetchAllPages(
    `/api/v1/runs/${encodeURIComponent(runId)}/steps`,
    sessionStepSchema,
    'load the steps of the run',
  )
}

/**
 * Sends a message. A message sent while no run is unfinished starts a run; the session sends
 * none while a run is unfinished.
 */
export function sendMessage(threadId: string, content: string) {
  return apiRequest(
    `/api/v1/threads/${encodeURIComponent(threadId)}/messages`,
    sendMessageResponseSchema,
    {
      action: 'send the message',
      method: 'POST',
      body: { content },
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    },
  )
}

export async function cancelRun(runId: string): Promise<void> {
  await apiCommand(`/api/v1/runs/${encodeURIComponent(runId)}/cancel`, {
    action: 'stop the run',
  })
}

/** Starts a new run from a step of a run; the steps before it are not run again. */
export function retryRun(runId: string, fromStepId: string): Promise<SessionRun> {
  return apiRequest(`/api/v1/runs/${encodeURIComponent(runId)}/retry`, sessionRunSchema, {
    action: 'retry the run',
    method: 'POST',
    body: { from_step_id: fromStepId },
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  })
}

/** The review that the run waits for, or null when none is pending. */
export async function getPendingReview(runId: string) {
  const page = await apiRequest(
    `/api/v1/runs/${encodeURIComponent(runId)}/interrupts?status=pending`,
    listPageSchema(pendingReviewSchema),
    { action: 'load the review' },
  )
  return page.items.at(0) ?? null
}

/** The items of the project whose key or content contain `q`, for `@`. */
export async function searchMentionItems(projectId: string, q: string) {
  const query = new URLSearchParams({ q, limit: '8' })
  const page = await apiRequest(
    `/api/v1/projects/${encodeURIComponent(projectId)}/items?${query.toString()}`,
    listPageSchema(mentionItemSchema),
    { action: 'search the items' },
  )
  return page.items
}
