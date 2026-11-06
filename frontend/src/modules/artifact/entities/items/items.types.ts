import { z } from 'zod'

import { type ContentValues, contentValuesSchema } from '@/modules/workflow/entities/@x/artifact'

import { originSchema, type ReviewStatus, reviewStatuses } from '../artifacts/artifacts.types'

// Temporary hand-written schemas for the items API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

export const itemSchema = z.object({
  id: z.string(),
  artifact_id: z.string(),
  project_id: z.string(),
  key: z.string(),
  kind: z.string(),
  parent_item_id: z.string().nullable(),
  position: z.number().int(),
  /** The outline number, such as `3.2.1`; in an artifact without sections, the place: `1`, `2`. */
  outline_number: z.string(),
  schema_version: z.number().int(),
  version: z.number().int(),
  review_status: z.enum(reviewStatuses),
  created_by: originSchema,
  updated_by: originSchema,
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  content: contentValuesSchema,
})

export type ArtifactItem = z.infer<typeof itemSchema>

/** An item in the outline of its artifact: `depth` is 1 at the top level. */
export const outlineItemSchema = itemSchema.extend({ depth: z.number().int() })

export type OutlineItem = z.infer<typeof outlineItemSchema>

/** An item of the nested shape: the items inside it are its `children`. */
export type NestedOutlineItem = OutlineItem & { children: NestedOutlineItem[] }

export const nestedOutlineItemSchema: z.ZodType<NestedOutlineItem> = outlineItemSchema.extend({
  children: z.lazy(() => z.array(nestedOutlineItemSchema)),
})

/** An item that a stage works on, one after another, such as an interviewee to interview. */
export interface StageSubject {
  id: string
  key: string
  title: string
}

/** A reference to an item at a version, such as an item that a step produced or a message names. */
export const itemRefSchema = z.object({
  item_id: z.string(),
  kind: z.string(),
  key: z.string(),
  version: z.number().int(),
})

export type ItemRef = z.infer<typeof itemRefSchema>

/** What every list of items is narrowed to; each field left out narrows nothing. */
export interface ItemFilters {
  kind?: string | undefined
  reviewStatus?: ReviewStatus | undefined
}

/** What the items of a project are narrowed to; each field left out narrows nothing. */
export interface ProjectItemFilters extends ItemFilters {
  /** The items that the run created or changed. */
  runId?: string | undefined
  /** Text to find in the key and the content. */
  text?: string | undefined
}

/** What the items of an artifact are narrowed to; each field left out narrows nothing. */
export interface ArtifactItemFilters extends ItemFilters {
  /** The items directly under this item. */
  parentItemId?: string | undefined
  /** The items as they were when the artifact was at this version. */
  version?: number | undefined
}

/** The body of a change of an item: the fields it sets, the others stay as they are. */
export interface UpdateItemBody {
  /** The fields of the content to set, which join the content the item has. */
  content?: ContentValues | undefined
  review_status?: ReviewStatus | undefined
}

/** The body that makes an item by hand: the server gives it its key and puts it last under its parent. */
export interface CreateItemBody {
  kind: string
  content: ContentValues
  /** The section or epic that holds it; null or left out for the top level. */
  parent_item_id?: string | null | undefined
}

/** The body that moves an item: under this parent, at this position among its children. */
export interface MoveItemBody {
  parent_item_id: string | null
  position: number
}
