import { z } from 'zod'

import { reviewStatuses } from '@/modules/artifact/entities/@x/trace'
import { contentValuesSchema } from '@/modules/workflow/entities/@x/trace'

import { type TraceLink, traceLinkSchema } from './trace-links.types'

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

/** Words of one item that a link quotes, seen from that item: `side` says whether the item is the source or the target of the link. */
export interface LinkQuote {
  link: TraceLink
  side: 'source' | 'target'
  quote: string
  /** The item at the other end of the link. */
  other: TraceItem
}

/** An `evidenced_by` link with its two items: the item that cites, and the item cited, such as a message of an interview, with the words it quotes. */
export interface Citation {
  link: TraceLink
  quote: string | null
  citing: TraceItem
  cited: TraceItem
}

/** One item that an item is based on (`derived_from`), with what it is based on in turn and the words it cites. */
export interface OriginStep {
  link: TraceLink
  item: TraceItem
  evidence: Citation[]
  steps: OriginStep[]
}

/** Where an item comes from: the words it cites itself, and the items it is based on. */
export interface OriginTree {
  evidence: Citation[]
  steps: OriginStep[]
}

/** A link of an item, with the item at its other end, its title, and whether the link was made from an older version of its target. */
export interface ItemLinkRow {
  link: TraceLink
  other: TraceItem
  title: string
  isOutOfDate: boolean
}

/** The links of one type from or to an item, titled by the link type of the definition. */
export interface ItemLinkGroup {
  linkType: string
  title: string
  rows: ItemLinkRow[]
}
