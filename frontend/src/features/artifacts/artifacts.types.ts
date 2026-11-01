import { z } from 'zod'

// Temporary hand-written schemas for the artifacts API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

const jsonTypeSchema = z.enum(['string', 'number', 'integer', 'boolean', 'array', 'object', 'null'])

/** One property of a content schema, with the keywords that the UI reads. */
export const schemaPropertySchema = z.looseObject({
  type: z.union([jsonTypeSchema, z.array(jsonTypeSchema)]).optional(),
  description: z.string().optional(),
  enum: z.array(z.union([z.string(), z.number(), z.null()])).optional(),
  /** The schema of the entries of an array; an object with properties for an `object-list`. */
  items: z.looseObject({}).optional(),
  properties: z.record(z.string(), z.looseObject({})).optional(),
  required: z.array(z.string()).optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  readOnly: z.boolean().optional(),
  'x-ui-widget': z.string().optional(),
  'x-value-from': z.string().optional(),
})

export type SchemaProperty = z.infer<typeof schemaPropertySchema>

/** A content schema of an artifact kind or of an item kind. */
export const contentSchemaSchema = z.looseObject({
  title: z.string(),
  'x-level': z.string().optional(),
  'x-kind': z.string().optional(),
  'x-key-prefix': z.string().optional(),
  'x-ui-display': z.string().optional(),
  'x-ui-title-field': z.string().optional(),
  'x-ui-list-fields': z.array(z.string()).optional(),
  'x-ui-field-order': z.array(z.string()).optional(),
  properties: z.record(z.string(), schemaPropertySchema).optional(),
  required: z.array(z.string()).optional(),
})

export type ContentSchema = z.infer<typeof contentSchemaSchema>

const kindSchema = z.object({
  kind: z.string(),
  schema_version: z.number().int(),
  schema: contentSchemaSchema,
})

export type KindSchema = z.infer<typeof kindSchema>

export const artifactKindsSchema = z.object({
  workflow_version: z.number().int(),
  artifact_kinds: z.array(kindSchema.extend({ item_kinds: z.array(kindSchema) })),
})

export type ArtifactKinds = z.infer<typeof artifactKindsSchema>

/** Who made a version: an agent in a step of a run, or the user. */
export const originSchema = z.object({
  actor: z.enum(['agent', 'user']),
  agent_role: z.string().nullable(),
  user_id: z.string().nullable(),
  run_id: z.string().nullable(),
  step_id: z.string().nullable(),
})

export type Origin = z.infer<typeof originSchema>

export const reviewStatuses = ['draft', 'approved', 'rejected', 'superseded'] as const

export const artifactSchema = z.object({
  id: z.string(),
  kind: z.string(),
  project_id: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  schema_version: z.number().int(),
  content: z.record(z.string(), z.unknown()),
  subject_item_id: z.string().nullable(),
  version: z.number().int(),
  review_status: z.enum(reviewStatuses),
  item_count: z.number().int(),
  created_by: originSchema,
  updated_by: originSchema,
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export type Artifact = z.infer<typeof artifactSchema>

export const itemSchema = z.object({
  id: z.string(),
  artifact_id: z.string(),
  project_id: z.string(),
  key: z.string(),
  kind: z.string(),
  parent_item_id: z.string().nullable(),
  position: z.number().int(),
  /** The outline number, such as `3.2.1`; null in an artifact that has no sections. */
  number: z.string().nullable(),
  schema_version: z.number().int(),
  version: z.number().int(),
  review_status: z.enum(reviewStatuses),
  created_by: originSchema,
  updated_by: originSchema,
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  content: z.record(z.string(), z.unknown()),
})

export type ArtifactItem = z.infer<typeof itemSchema>

/** An item in the outline of its artifact: `depth` is 1 at the top level. */
export const outlineItemSchema = itemSchema.extend({ depth: z.number().int() })

export type OutlineItem = z.infer<typeof outlineItemSchema>

export const changeReasons = ['generated', 'user_edit', 'rework', 'restored', 'deleted'] as const

export const revisionSchema = z.object({
  version: z.number().int(),
  change_reason: z.enum(changeReasons),
  changed_by: originSchema,
  created_at: z.iso.datetime(),
  /** The content of the item at this version, to compare it with the next one. */
  content: z.record(z.string(), z.unknown()),
})

export type Revision = z.infer<typeof revisionSchema>

/** An item in the chain of a trace. */
export const traceNodeSchema = z.object({
  id: z.string(),
  artifact_id: z.string(),
  key: z.string(),
  kind: z.string(),
  version: z.number().int(),
  review_status: z.enum(reviewStatuses),
  content: z.record(z.string(), z.unknown()),
})

export type TraceNode = z.infer<typeof traceNodeSchema>

export const traceLinkSchema = z.object({
  id: z.string(),
  source_item_id: z.string(),
  target_item_id: z.string(),
  link_type: z.string(),
  /** The version of the target when the link was made. */
  target_version: z.number().int(),
  quote: z.string().nullable(),
  note: z.string().nullable(),
})

export type TraceLink = z.infer<typeof traceLinkSchema>

export const traceSchema = z.object({
  nodes: z.array(traceNodeSchema),
  links: z.array(traceLinkSchema),
})

export type Trace = z.infer<typeof traceSchema>

export const exportSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  template: z.string(),
  format: z.string(),
  status: z.enum(['pending', 'ready', 'failed']),
  file_name: z.string(),
  size_bytes: z.number().int().nullable(),
  /** Present when the export is ready; valid for a limited time. */
  download_url: z.string().nullable(),
  created_at: z.iso.datetime(),
})

export type Export = z.infer<typeof exportSchema>

/** What the artifacts read of the workflow definition: its export templates and link types. */
export const definitionSummarySchema = z.object({
  export_templates: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      artifact_kinds: z.array(z.string()),
      formats: z.array(z.string()),
    }),
  ),
  link_types: z.array(z.object({ key: z.string(), label: z.string() })),
})

export type DefinitionSummary = z.infer<typeof definitionSummarySchema>
