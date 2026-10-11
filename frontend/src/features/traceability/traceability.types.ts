import { z } from 'zod'

const isoDatetime = z.iso.datetime()

/** The item a link points from or to, resolved by the API. */
export const itemLinkRefSchema = z.object({
  id: z.string(),
  key: z.string(),
  kind: z.string(),
  review_status: z.string(),
})
export type ItemLinkRef = z.infer<typeof itemLinkRefSchema>

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

/** All the matrix needs of an item. */
export const matrixItemSchema = z.object({
  id: z.string(),
  key: z.string(),
  kind: z.string(),
  review_status: z.string(),
  updated_at: isoDatetime,
})
export type MatrixItem = z.infer<typeof matrixItemSchema>
