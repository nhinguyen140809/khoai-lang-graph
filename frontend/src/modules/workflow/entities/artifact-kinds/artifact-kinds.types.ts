import { z } from 'zod'

// Temporary hand-written schemas for the artifact kinds API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

// How the types hold one another, from the outside in:
//
//   ArtifactKinds                  the answer of the API: the version of the workflow and its kinds
//   `-- artifact_kinds[]           one kind of artifact, as a KindSchema
//       |-- schema                 the ContentSchema of the artifact itself
//       `-- item_kinds[]           the kinds of item that the artifact holds, each a KindSchema
//           `-- schema             the ContentSchema of one item
//
//   ContentSchema                  the fields of one content, with the hints for showing them
//   `-- properties{}               one SchemaProperty for each field
//       `-- items                  for an array field: the schema of one entry, which has its own
//                                  properties and required names when the entries are objects
//
// These types describe what the API sends. `contentFields(schema)` in `content-fields.utils.ts` reads
// a ContentSchema into one ContentField (see `content-fields.types.ts`) for each of its properties:
// a SchemaProperty is the raw keywords of the schema, a ContentField is what a screen uses from them.

const jsonTypeSchema = z.enum(['string', 'number', 'integer', 'boolean', 'array', 'object', 'null'])

/** One field of a content schema, with the keywords that the app reads. */
export const schemaPropertySchema = z.looseObject({
  type: z.union([jsonTypeSchema, z.array(jsonTypeSchema)]).optional(),
  /** The title of the field. */
  title: z.string().optional(),
  description: z.string().optional(),
  enum: z.array(z.union([z.string(), z.number(), z.null()])).optional(),
  /** The schema of the entries of an array; it has properties for an `object-list`. */
  get items() {
    return z
      .looseObject({
        properties: z.record(z.string(), schemaPropertySchema).optional(),
        required: z.array(z.string()).optional(),
      })
      .optional()
  },
  /** The fields of an object field; they are kept as they come and not read. */
  properties: z.record(z.string(), z.looseObject({})).optional(),
  required: z.array(z.string()).optional(),
  minItems: z.number().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  readOnly: z.boolean().optional(),
  default: z.unknown().optional(),
  'x-ui-widget': z.string().optional(),
  'x-value-from': z.string().optional(),
  'x-value-list': z.string().optional(),
})

export type SchemaProperty = z.infer<typeof schemaPropertySchema>

/**
 * The schema of the content of one artifact or one item: its fields in `properties`, which of them
 * must be filled in `required`, and the `x-` keywords that say how the kind is shown.
 */
export const contentSchemaSchema = z.looseObject({
  title: z.string(),
  'x-level': z.string().optional(),
  'x-kind': z.string().optional(),
  'x-key-prefix': z.string().optional(),
  'x-ui-display': z.string().optional(),
  'x-ui-navigable': z.boolean().optional(),
  'x-ui-title-field': z.string().optional(),
  'x-ui-list-fields': z.array(z.string()).optional(),
  'x-ui-field-order': z.array(z.string()).optional(),
  properties: z.record(z.string(), schemaPropertySchema).optional(),
  required: z.array(z.string()).optional(),
})

export type ContentSchema = z.infer<typeof contentSchemaSchema>

/** One kind of artifact or of item: its name, the version of its schema, and the schema. */
const kindSchemaSchema = z.object({
  kind: z.string(),
  schema_version: z.number().int(),
  schema: contentSchemaSchema,
})

/** A kind with the version of its content schema, and the schema. */
export type KindSchema = z.infer<typeof kindSchemaSchema>

/** The kinds of the workflow: each kind of artifact holds the kinds of item that go in it. */
export const artifactKindsSchema = z.object({
  workflow_version: z.number().int(),
  artifact_kinds: z.array(kindSchemaSchema.extend({ item_kinds: z.array(kindSchemaSchema) })),
})

export type ArtifactKinds = z.infer<typeof artifactKindsSchema>
