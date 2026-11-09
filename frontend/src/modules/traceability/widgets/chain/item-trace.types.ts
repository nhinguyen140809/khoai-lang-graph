import type { Edge as FlowEdge, Node as FlowNode } from '@xyflow/react'

import type { ChainEdgeData, ChainNodeData } from '@/modules/trace/entities'
import type { GraphLayout } from '@/shared/lib/graph'

/** The places of the nodes of a chain, by node id, in the coordinates of its graph. */
export type ChainPositions = GraphLayout['positions']

/** What the canvas draws a node with: the node. */
export type ChainNodeView = Record<string, unknown> & ChainNodeData

/** What the canvas draws an edge with: the link, whether it is chosen, and what choosing it does. */
export interface ChainEdgeView extends Record<string, unknown>, ChainEdgeData {
  isSelected: boolean
  onSelect: () => void
}

export type ChainFlowNode = FlowNode<ChainNodeView, 'chain'>
export type ChainFlowEdge = FlowEdge<ChainEdgeView, 'chain'>

/** One column of the chain, as the layout places it: the kinds of the items it holds. */
export interface ChainColumn {
  /** The left edge of the column, in the coordinates of the graph. */
  x: number
  /** The top of its topmost node, so the label sits above it. */
  y: number
  /** The kinds of the items of the column, in the order they first appear. */
  kinds: string[]
}
