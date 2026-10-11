import { z } from 'zod'

import { apiRequest, fetchAllPages } from '@/lib/api-fetch.utils'

import type { Run, RunStep } from './workflow.types'
import { runSchema, runStepSchema, threadIdSchema } from './workflow.types'

// TODO: switch to the generated client in src/api/generated/ once it is generated.

/** The conversation thread of the project; a project has one. */
export async function conversationThreadId(projectId: string): Promise<string> {
  const threads = await fetchAllPages(
    `/api/v1/projects/${encodeURIComponent(projectId)}/threads`,
    threadIdSchema,
    'load the conversation',
  )
  return threads[0]?.id ?? ''
}

/** The runs of the conversation thread, newest first. */
export function listThreadRuns(threadId: string): Promise<Run[]> {
  return fetchAllPages(
    `/api/v1/threads/${encodeURIComponent(threadId)}/runs`,
    runSchema,
    'load the runs',
  )
}

/** One run. */
export function getRun(runId: string): Promise<Run> {
  return apiRequest(`/api/v1/runs/${encodeURIComponent(runId)}`, runSchema, {
    action: 'load the run',
  })
}

/** The steps of a run, in order. */
export function listRunSteps(runId: string): Promise<RunStep[]> {
  return fetchAllPages(
    `/api/v1/runs/${encodeURIComponent(runId)}/steps`,
    runStepSchema,
    'load the steps of the run',
  )
}

const pendingInterruptSchema = z.object({
  id: z.string(),
  node: z.string(),
  created_at: z.iso.datetime(),
})
export type PendingInterrupt = z.infer<typeof pendingInterruptSchema>

/** The interrupt the run waits at, if any (GET ?status=pending). */
export function getPendingInterrupt(runId: string): Promise<PendingInterrupt | null> {
  return apiRequest(
    `/api/v1/runs/${encodeURIComponent(runId)}/interrupts?status=pending`,
    z.array(pendingInterruptSchema),
    { action: 'load the pending review' },
  ).then((entries) => entries[0] ?? null)
}

const liteItemSchema = z.object({ id: z.string(), key: z.string() })

/** The items of the project as {id, key}, to name an interview's persona. */
export function listSubjectKeys(projectId: string): Promise<Map<string, string>> {
  return fetchAllPages(
    `/api/v1/projects/${encodeURIComponent(projectId)}/items`,
    liteItemSchema,
    'load the persona keys',
  ).then((items): Map<string, string> => new Map(items.map((item) => [item.id, item.key])))
}
