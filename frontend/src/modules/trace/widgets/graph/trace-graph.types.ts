import type { ReviewStatus } from '@/modules/artifact/entities'

// The graph of a trace, for drawing: an item is a node and a link is an edge. `items` and `links`
// are the data of the trace; `nodes` and `edges` are the same data shaped for the drawing.

/** An item of a trace as a node of its graph. */
export interface TraceGraphNode {
  id: string
  key: string
  kind: string
  title: string
  version: number
  reviewStatus: ReviewStatus
  /** Whether a newer item replaced this one. */
  isSuperseded: boolean
}

/** A link of a trace as an edge of its graph, from the later item to the item it was built from. */
export interface TraceGraphEdge {
  /** The id of the link. */
  id: string
  source: string
  target: string
  linkType: string
  /** Whether the source needs a new look: see `isLinkOutOfDate`. */
  isOutOfDate: boolean
  /** The words of the target that support the source, for a link that has them. */
  quote: string | null
}

/** The nodes and the edges of a trace. */
export interface TraceGraph {
  nodes: TraceGraphNode[]
  edges: TraceGraphEdge[]
}
