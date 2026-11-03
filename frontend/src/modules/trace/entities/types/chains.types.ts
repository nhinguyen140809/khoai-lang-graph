import { z } from 'zod'

import { reviewStatuses } from '@/modules/artifact/entities/@x/trace'
import { contentValuesSchema } from '@/modules/workflow/entities/@x/trace'

import { traceLinkSchema } from './trace-links.types'

// A trace is the items that an item or an artifact leads to through links, and the links between
// them (the chains of items). It is data: `trace-graph.types.ts` shapes it for drawing.

/** Which way a trace follows the links from its start: to what an item was built from, to what was built from it, or both. */
export const traceDirections = ['backward', 'forward', 'both'] as const

export type TraceDirection = (typeof traceDirections)[number]

/** An item found by a trace. */
export const traceItemSchema = z.object({
  id: z.string(),
  artifact_id: z.string(),
  key: z.string(),
  kind: z.string(),
  version: z.number().int(),
  review_status: z.enum(reviewStatuses),
  content: contentValuesSchema,
})

export type TraceItem = z.infer<typeof traceItemSchema>

/** The items that a trace reaches, and the current links between them. */
export const traceSchema = z.object({
  items: z.array(traceItemSchema),
  links: z.array(traceLinkSchema),
})

export type Trace = z.infer<typeof traceSchema>

/** How far a trace goes; each field left out takes the default of the API. */
export interface TraceQuery {
  direction?: TraceDirection | undefined
  /** How many links away from its start a trace goes. */
  depth?: number | undefined
}
