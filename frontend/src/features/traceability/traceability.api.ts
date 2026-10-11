import { z } from 'zod'

import { apiRequest, fetchAllPages } from '@/lib/api-fetch.utils'

import { matrixItemSchema, traceLinkSchema } from './traceability.types'

// TODO: switch to the generated client in src/api/generated/ once it is generated.

/** The trace links of the project, both ends resolved. */
export function listProjectLinks(projectId: string) {
  return fetchAllPages(
    `/api/v1/projects/${encodeURIComponent(projectId)}/trace-links`,
    traceLinkSchema,
    'load the trace links',
  )
}

/** Every item of the project; the issues view needs its key and kind. */
export function listProjectItems(projectId: string) {
  return fetchAllPages(
    `/api/v1/projects/${encodeURIComponent(projectId)}/items`,
    matrixItemSchema,
    'load the items for the matrix',
  )
}

const matrixChainRefSchema = z.object({
  id: z.string(),
  key: z.string(),
  kind: z.string(),
  review_status: z.string(),
})
export type MatrixChainRef = z.infer<typeof matrixChainRefSchema>

/** The server builds one row per derived_from chain (API.md). */
const matrixRowSchema = z.object({
  backlog: matrixChainRefSchema.nullable(),
  spec: matrixChainRefSchema.nullable(),
  analyzed: matrixChainRefSchema.nullable(),
  source: z.array(matrixChainRefSchema),
  evidence: z.array(matrixChainRefSchema),
})
export type MatrixRow = z.infer<typeof matrixRowSchema>

const matrixSchema = z.object({ rows: z.array(matrixRowSchema) })

const coverageEntrySchema = z.object({
  count: z.number().int(),
  items: z.array(matrixChainRefSchema),
})

/** The three coverage lists of API.md. */
export const coverageSchema = z.object({
  no_backlog_item: coverageEntrySchema,
  no_source: coverageEntrySchema,
  needs_review: coverageEntrySchema,
})
export type TraceCoverage = z.infer<typeof coverageSchema>

/** Rows of derived_from chains from backlog item down to raw requirement. */
export function getMatrix(projectId: string) {
  return apiRequest(
    `/api/v1/projects/${encodeURIComponent(projectId)}/traceability/matrix`,
    matrixSchema,
    { action: 'load the coverage matrix' },
  )
}

/** Counts and lists: no backlog item, no source, needs review. */
export function getCoverage(projectId: string) {
  return apiRequest(
    `/api/v1/projects/${encodeURIComponent(projectId)}/traceability/coverage`,
    coverageSchema,
    { action: 'load the coverage' },
  )
}
