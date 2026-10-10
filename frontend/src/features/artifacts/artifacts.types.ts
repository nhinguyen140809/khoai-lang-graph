import { z } from 'zod'

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
