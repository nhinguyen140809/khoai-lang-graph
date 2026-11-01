import { z } from 'zod'

// Temporary hand-written schemas for the traceability endpoints.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** An item as a row or a list shows it. */
export const itemRefSchema = z.object({
  item_id: z.string(),
  key: z.string(),
  kind: z.string(),
  title: z.string(),
})

export type ItemRef = z.infer<typeof itemRefSchema>

/** The matrix: its columns come from the server, and a cell holds the items of its column. */
export const matrixSchema = z.object({
  columns: z.array(z.object({ key: z.string(), label: z.string(), kinds: z.array(z.string()) })),
  rows: z.array(z.object({ cells: z.record(z.string(), z.array(itemRefSchema)) })),
})

export type Matrix = z.infer<typeof matrixSchema>

/** The kinds of gap in the trace of a project, each with the items it holds. */
export const coverageSchema = z.object({
  gaps: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      description: z.string(),
      items: z.array(itemRefSchema),
    }),
  ),
})

export type Coverage = z.infer<typeof coverageSchema>

export const projectItemSchema = z.looseObject({
  id: z.string(),
  key: z.string(),
  kind: z.string(),
  content: z.record(z.string(), z.unknown()),
})

export type ProjectItem = z.infer<typeof projectItemSchema>

export const linkSchema = z.looseObject({
  id: z.string(),
  source_item_id: z.string(),
  target_item_id: z.string(),
  link_type: z.string(),
})

export type Link = z.infer<typeof linkSchema>
