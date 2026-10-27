import { z } from 'zod'

import { type ContentValues, contentValuesSchema } from '@/modules/workflow/entities/@x/artifact'

// Temporary hand-written schemas for the artifacts API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

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

export type ReviewStatus = (typeof reviewStatuses)[number]

export const artifactSchema = z.object({
  id: z.string(),
  kind: z.string(),
  project_id: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  schema_version: z.number().int(),
  content: contentValuesSchema,
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

/** A reference to an artifact at a version, such as an artifact a message names or an export holds. */
export const artifactRefSchema = z.object({
  artifact_id: z.string(),
  kind: z.string(),
  title: z.string(),
  version: z.number().int(),
})

export type ArtifactRef = z.infer<typeof artifactRefSchema>

/** What the artifacts of a project are narrowed to; each field left out narrows nothing. */
export interface ArtifactFilters {
  kind?: string | undefined
  reviewStatus?: ReviewStatus | undefined
}

/** The body of a change of an artifact: the fields it sets, the others stay as they are. */
export interface UpdateArtifactBody {
  title?: string | undefined
  summary?: string | null | undefined
  /** The fields of the content to set, which join the content the artifact has. */
  content?: ContentValues | undefined
  review_status?: ReviewStatus | undefined
}
