import type { ComponentProps } from 'react'

import {
  type AttentionLevel,
  type ReviewStatus,
  reviewStatus,
  reviewStatusNodeLooks,
} from '@/modules/artifact/entities'
import type { ChainEdgeData, ChainNodeData } from '@/modules/trace/entities'
import type { Node } from '@/shared/components/ui/node'

import { chainNodeAttentionLooks, chainSubjectLook } from './item-trace.constants'
import type { ChainColumn, ChainFlowEdge, ChainFlowNode, ChainPositions } from './item-trace.types'

/** What decides how a node of the chain looks: its item, and what it asks of the user. */
interface ChainNodeState {
  status: ReviewStatus
  attention: AttentionLevel
  /** Whether the item is the one the page is about. */
  isSubject: boolean
}

/**
 * The props of a `Node` that paint a node of the chain. `data-focus` is present only on the node of
 * the item of the page: the ring of the node reads whether the attribute is there.
 */
type ChainNodeProps = Pick<
  ComponentProps<typeof Node>,
  'variant' | 'color' | 'isFaded' | 'aria-current'
> & { 'data-focus': '' | undefined }

/**
 * How a node of the chain is painted, from the state of its item, in one place: no part of the
 * screen works a color out for itself.
 *
 * - The item of the page is the solid node, whatever else it is.
 * - Else what the item asks of the user decides: an item to check or to follow takes the fill of
 *   that level.
 * - Else an item that was rejected or replaced is set aside, muted and faded.
 * - Any other item asks nothing, and its review status paints it.
 */
export function chainNodeProps({ status, attention, isSubject }: ChainNodeState): ChainNodeProps {
  if (isSubject) {
    return { ...chainSubjectLook, isFaded: false, 'data-focus': '', 'aria-current': 'page' }
  }
  const isSetAside = status === reviewStatus.rejected || status === reviewStatus.superseded
  const level: AttentionLevel =
    attention === 'act' || attention === 'follow'
      ? attention
      : attention === 'quiet' || isSetAside
        ? 'quiet'
        : 'none'
  const look = chainNodeAttentionLooks[level] ?? reviewStatusNodeLooks[status]
  return {
    variant: look.variant,
    color: look.color,
    isFaded: level === 'quiet',
    'data-focus': undefined,
    'aria-current': undefined,
  }
}

/** The nodes of the chain as the canvas draws them, each at its place from the layout. */
export function chainFlowNodes(
  nodes: readonly ChainNodeData[],
  positions: ChainPositions,
): ChainFlowNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: 'chain' as const,
    position: positions[node.id] ?? { x: 0, y: 0 },
    data: { ...node },
  }))
}

/** What the edges of the chain need beyond their links: the chosen link and its setter. */
interface ChainFlowEdgeOptions {
  selectedLinkId: string | null
  onSelect: (linkId: string) => void
}

/** The edges of the chain as the canvas draws them: each knows whether its link is chosen. */
export function chainFlowEdges(
  edges: readonly ChainEdgeData[],
  { selectedLinkId, onSelect }: ChainFlowEdgeOptions,
): ChainFlowEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    type: 'chain' as const,
    source: edge.source,
    target: edge.target,
    data: {
      ...edge,
      isSelected: edge.id === selectedLinkId,
      onSelect: () => {
        onSelect(edge.id)
      },
    },
  }))
}

/**
 * The columns of the chain, from left to right: the nodes that share a left edge in the layout form
 * one column, which holds the kinds of its items, in the order they first appear, and the top of its
 * topmost node. A node the layout did not place belongs to no column.
 */
export function chainColumnsOf(
  nodes: readonly ChainNodeData[],
  positions: ChainPositions,
): ChainColumn[] {
  const byX = new Map<number, { y: number; kinds: Set<string> }>()
  for (const node of nodes) {
    const place = positions[node.id]
    if (place === undefined) continue
    const column = byX.get(place.x) ?? { y: place.y, kinds: new Set<string>() }
    column.y = Math.min(column.y, place.y)
    column.kinds.add(node.kindTitle)
    byX.set(place.x, column)
  }
  return [...byX.entries()]
    .map(([x, { y, kinds }]) => ({ x, y, kinds: [...kinds] }))
    .toSorted((a, b) => a.x - b.x)
}
