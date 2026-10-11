import { z } from 'zod'

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
    `/api/v1/projects/${encodeURIComponent(projectId)}/trace-links`,
    traceLinkSchema,
    'load the trace links',
  )
}
// ---------------------------------------------------------------------------
// Kinds, revisions, trace — the views the Artifacts tab draws (web-app.md §6).

import type { ArtifactKindsSummary } from './artifacts.types'
import { artifactKindsSummarySchema } from './artifacts.types'

/** The kinds of artifacts and of items with their content schemas; the
 * field order and widgets come from the `x-ui-*` keywords. */
export function getArtifactKinds(): Promise<ArtifactKindsSummary> {
  return apiRequest('/api/v1/artifact-kinds', artifactKindsSummarySchema, {
    action: 'load the artifact kinds',
  })
}

const itemRevisionSchema = z.object({
  item_id: z.string(),
  version: z.number().int(),
  change_reason: z.enum(['generated', 'user_edit', 'rework', 'restored', 'deleted']),
  snapshot: z.record(z.string(), z.unknown()),
  created_at: z.iso.datetime(),
})
export type ItemRevision = z.infer<typeof itemRevisionSchema>

/** The version history of one item, newest first (API.md). */
export function getItemRevisions(itemId: string): Promise<ItemRevision[]> {
  return fetchAllPages(
    `/api/v1/items/${encodeURIComponent(itemId)}/revisions`,
    itemRevisionSchema,
    'load the item revisions',
  )
}

const traceTrackRefSchema = z.object({
  id: z.string(),
  key: z.string(),
  kind: z.string(),
  review_status: z.string(),
})
export type TraceTrackRef = z.infer<typeof traceTrackRefSchema>

const trackLinkSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  link_type: z.string(),
  source: traceTrackRefSchema,
  target: traceTrackRefSchema,
  target_version: z.number().int(),
  quote: z.string().nullable(),
  note: z.string().nullable(),
})

const itemTraceBodySchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      key: z.string(),
      kind: z.string(),
      review_status: z.string(),
    }),
  ),
  links: z.array(trackLinkSchema),
})
export type ItemTraceBody = z.infer<typeof itemTraceBodySchema>

/** The chain of one item: `nodes` and `links` (API.md ?direction/depth). */
export function getItemTrace(itemId: string): Promise<ItemTraceBody> {
  return apiRequest(`/api/v1/items/${encodeURIComponent(itemId)}/trace`, itemTraceBodySchema, {
    action: 'load the trace of the item',
  })
}
