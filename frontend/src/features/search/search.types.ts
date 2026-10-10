import { z } from 'zod'

// Temporary hand-written schema for the items API.
// TODO: replace with the types generated into src/api/generated/ once they exist.

export const itemSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  /** The readable id of the item, such as "REQ-001". */
  key: z.string(),
  kind: z.string(),
  review_status: z.string(),
  /** The fields of the item; they differ by kind. */
  content: z.record(z.string(), z.unknown()),
  updated_at: z.iso.datetime(),
})

export type Item = z.infer<typeof itemSchema>
