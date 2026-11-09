import { z } from 'zod'

// Temporary hand-written schemas for the traceability API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

// Traceability is the views of a whole project: the matrix and the coverage. A trace (see
// `chains.types.ts`) starts at an item or an artifact instead.

/**
 * An item as a cell or a list of the traceability views shows it: its key and kind with its title,
 * which a reference to an item at a version (`ItemRef` of the artifact entity) does not carry.
 */
export const itemSummarySchema = z.object({
  item_id: z.string(),
  key: z.string(),
  kind: z.string(),
  title: z.string(),
})

export type ItemSummary = z.infer<typeof itemSummarySchema>

/** The matrix: its columns come from the server, and a cell holds the items of its column. */
export const matrixSchema = z.object({
  columns: z.array(z.object({ key: z.string(), title: z.string(), kinds: z.array(z.string()) })),
  rows: z.array(z.object({ cells: z.record(z.string(), z.array(itemSummarySchema)) })),
})

export type Matrix = z.infer<typeof matrixSchema>

/** One target of the links of an item that changed after the link to it was made. */
export const changedTargetSchema = z.object({
  target: itemSummarySchema,
  link_type: z.string(),
  made_from_version: z.number().int(),
  current_version: z.number().int(),
})

export type ChangedTarget = z.infer<typeof changedTargetSchema>

/**
 * An item of the coverage of a gap. An item of the `needs_review` gap also carries the targets of
 * its links that changed after the link was made, each with the version the link was made from
 * and the version of the target now, so a screen can say why the item is listed.
 */
export const coverageItemSchema = itemSummarySchema.extend({
  changed_targets: z.array(changedTargetSchema).optional(),
})

export type CoverageItem = z.infer<typeof coverageItemSchema>

/** The kinds of gap in the links of a project, each with the items it holds. */
export const coverageSchema = z.object({
  gaps: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      description: z.string(),
      items: z.array(coverageItemSchema),
    }),
  ),
})

export type Coverage = z.infer<typeof coverageSchema>
