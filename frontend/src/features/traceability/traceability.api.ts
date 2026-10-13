import { apiRequest, fetchAllPages } from '@/shared/api/api-fetch.utils'

import { coverageSchema, linkSchema, matrixSchema, projectItemSchema } from './traceability.types'

// TODO: switch to the generated client in src/api/generated/ once it is generated.

const id = encodeURIComponent

export function getMatrix(projectId: string) {
  return apiRequest(`/api/v1/projects/${id(projectId)}/traceability/matrix`, matrixSchema, {
    action: 'load the traceability matrix',
  })
}

export function getCoverage(projectId: string) {
  return apiRequest(`/api/v1/projects/${id(projectId)}/traceability/coverage`, coverageSchema, {
    action: 'load the coverage',
  })
}

export function listProjectItems(projectId: string) {
  return fetchAllPages(
    `/api/v1/projects/${id(projectId)}/items`,
    projectItemSchema,
    'load the items',
  )
}

/** The current links of a project of the given types. */
export function listLinks(projectId: string, linkTypes: readonly string[]) {
  const query = linkTypes.map((type) => `link_type=${encodeURIComponent(type)}`).join('&')
  return fetchAllPages(
    `/api/v1/projects/${id(projectId)}/trace-links?${query}`,
    linkSchema,
    'load the links',
  )
}
