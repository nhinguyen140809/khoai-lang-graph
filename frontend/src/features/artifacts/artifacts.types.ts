import { z } from 'zod'

// Temporary hand-written schemas for the artifacts API.
// TODO: replace with types generated into src/api/generated/ once they exist.

// A content schema as the UI reads it: the display name of a kind and its key prefix.
const contentSchemaSummarySchema = z.object({
  title: z.string(),
  'x-key-prefix': z.string().optional(),
  'x-ui-display': z.string().optional(),
})

const itemKindSummarySchema = z.object({
  kind: z.string(),
  schema_version: z.number().int(),
  schema: contentSchemaSummarySchema,
})

export type ItemKindSummary = z.infer<typeof itemKindSummarySchema>

export const artifactKindsSummarySchema = z.object({
  workflow_version: z.number().int(),
  artifact_kinds: z.array(
    itemKindSummarySchema.extend({ item_kinds: z.array(itemKindSummarySchema) }),
  ),
})

export type ArtifactKindsSummary = z.infer<typeof artifactKindsSummarySchema>

const isoDatetime = z.iso.datetime()

/** One artifact instance of the project, GET /projects/{id}/artifacts. */
export const artifactSummarySchema = z.object({
  id: z.string(),
  project_id: z.string(),
  kind: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  schema_version: z.number().int(),
  version: z.number().int(),
  review_status: z.string(),
  updated_at: isoDatetime,
})
export type ArtifactSummary = z.infer<typeof artifactSummarySchema>

/** An item as the artifacts tree reads it: its artifact carries the tree node above it. */
export const treeItemSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  artifact_id: z.string(),
  key: z.string(),
  kind: z.string(),
  review_status: z.string(),
  content: z.record(z.string(), z.unknown()),
  version: z.number().int(),
  updated_at: isoDatetime,
})
export type TreeItem = z.infer<typeof treeItemSchema>

/** The item a link points from or to. */
export const itemLinkRefSchema = z.object({
  id: z.string(),
  key: z.string(),
  kind: z.string(),
  review_status: z.string(),
})
export type ItemLinkRef = z.infer<typeof itemLinkRefSchema>

/** One trace link of the project, both ends resolved. */
export const traceLinkSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  link_type: z.string(),
  source: itemLinkRefSchema,
  target: itemLinkRefSchema,
  target_version: z.number().int(),
  quote: z.string().nullable(),
  note: z.string().nullable(),
})
export type TraceLink = z.infer<typeof traceLinkSchema>
