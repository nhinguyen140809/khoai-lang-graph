import { apiRequest, fetchAllPages } from '@/lib/api-fetch.utils'

import {
  type ArtifactSummary,
  artifactSummarySchema,
  type TraceLink,
  traceLinkSchema,
  type TreeItem,
  treeItemSchema,
} from './artifacts.types'

// TODO: switch to the generated client in src/api/generated/ once it is generated.

/** The artifacts of the project, the tree roots of the Artifacts tab. */
export function listProjectArtifacts(projectId: string): Promise<ArtifactSummary[]> {
  return fetchAllPages(
    `/api/v1/projects/${encodeURIComponent(projectId)}/artifacts`,
    artifactSummarySchema,
    'load the artifacts',
  )
}

/** Every item of the project; each carries the artifact it belongs to. */
export function listProjectTreeItems(projectId: string): Promise<TreeItem[]> {
  return fetchAllPages(
    `/api/v1/projects/${encodeURIComponent(projectId)}/items`,
    treeItemSchema,
    'load the items of the artifacts',
  )
}

/** One item by id (GET /items/{id}). */
export function getArtifactItem(itemId: string): Promise<TreeItem> {
  return apiRequest(`/api/v1/items/${encodeURIComponent(itemId)}`, treeItemSchema, {
    action: 'load the item',
  })
}

/** Convenience for components that need only the trace links of a project. */
export function listProjectLinks(projectId: string): Promise<TraceLink[]> {
  return fetchAllPages(
    `/api/v1/projects/${encodeURIComponent(projectId)}/links`,
    traceLinkSchema,
    'load the trace links',
  )
}
