import { type Run, runSchema } from '@/modules/run/entities/@x/review'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { apiRequest, fetchPage, type ListPage } from '@/shared/api/request'
import { pathWithQuery } from '@/shared/lib/url'

import {
  type Interrupt,
  type InterruptFilters,
  interruptSchema,
  type ResumeRunBody,
} from './interrupts.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** One page of the interrupts of a run, the oldest first, narrowed by the filters. */
export function listRunInterrupts(
  runId: string,
  cursor: string | null,
  limit: number,
  filters: InterruptFilters = {},
): Promise<ListPage<Interrupt>> {
  // The API applies the filters: the page holds the interrupts of one status, or every interrupt.
  const path = pathWithQuery(apiEndpoints.runInterrupts.path({ runId }), { status: filters.status })
  return fetchPage(path, interruptSchema, {
    limit,
    cursor,
    action: 'load the interrupts of the run',
  })
}

/** The interrupt that the run waits for, or null when it waits for nothing. */
export async function findPendingInterrupt(runId: string): Promise<Interrupt | null> {
  const { items } = await listRunInterrupts(runId, null, 1, { status: 'pending' })
  return items[0] ?? null
}

/**
 * Answers the pending interrupt of a run; the run goes on. The request goes with `idempotencyKey`,
 * so that sending it again answers with the first answer and does no work twice.
 */
export function resumeRun(
  runId: string,
  body: ResumeRunBody,
  idempotencyKey: string,
): Promise<Run> {
  return apiRequest(apiEndpoints.runResume.path({ runId }), runSchema, {
    action: 'answer the review',
    method: HttpMethod.Post,
    body,
    idempotencyKey,
  })
}
