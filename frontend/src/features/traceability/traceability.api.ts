import { fetchAllPages } from '@/lib/api-fetch.utils'

import { matrixItemSchema, traceLinkSchema } from './traceability.types'

// TODO: switch to the generated client in src/api/generated/ once it is generated.

/** The trace links of the project, both ends resolved. */
export function listProjectLinks(projectId: string) {
  return fetchAllPages(
    `/api/v1/projects/${encodeURIComponent(projectId)}/links`,
    traceLinkSchema,
    'load the trace links',
  )
}

/** Every item of the project; the matrix needs only its key and kind. */
export function listProjectItems(projectId: string) {
  return fetchAllPages(
    `/api/v1/projects/${encodeURIComponent(projectId)}/items`,
    matrixItemSchema,
    'load the items for the matrix',
  )
}
