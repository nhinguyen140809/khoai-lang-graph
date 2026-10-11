import { apiRequest, fetchAllPages, listPageSchema } from '@/lib/api-fetch.utils'

import {
  interruptSchema,
  type ResumeBody,
  resumedRunSchema,
  reviewedItemSchema,
} from './review.types'

// TODO: switch to the generated client in src/api/generated/ once it is generated.

const id = encodeURIComponent

/** The review that the run waits for, or null when the run waits for none. */
export async function getPendingInterrupt(runId: string) {
  const page = await apiRequest(
    `/api/v1/runs/${id(runId)}/interrupts?status=pending`,
    listPageSchema(interruptSchema),
    { action: 'load the review' },
  )
  return page.items.at(0) ?? null
}

/** Answers the interrupt; the run continues. */
export function resumeRun(runId: string, body: ResumeBody) {
  return apiRequest(`/api/v1/runs/${id(runId)}/resume`, resumedRunSchema, {
    action: 'send the answer',
    method: 'POST',
    body,
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  })
}

/** The items of the artifacts under review, to tell the ones the user changed. */
export async function listReviewedItems(artifactIds: string[]) {
  const lists = await Promise.all(
    artifactIds.map((artifactId) =>
      fetchAllPages(
        `/api/v1/artifacts/${id(artifactId)}/items`,
        reviewedItemSchema,
        'load the items under review',
      ),
    ),
  )
  return lists.flat()
}
