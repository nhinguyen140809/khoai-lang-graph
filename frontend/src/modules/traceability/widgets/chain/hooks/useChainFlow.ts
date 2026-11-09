'use client'

import { useMemo } from 'react'

import type { ChainGraph } from '@/modules/trace/entities'

import type { ChainPositions } from '../item-trace.types'
import { chainFlowEdges, chainFlowNodes } from '../item-trace.utils'

/**
 * The nodes and the edges of the canvas of the chain, drawn from its graph and its layout: the
 * edges know whether their link is chosen, so choosing a link redraws the edges and not the nodes.
 */
export function useChainFlow(
  graph: ChainGraph,
  positions: ChainPositions,
  {
    selectedLinkId,
    onSelect,
  }: { selectedLinkId: string | null; onSelect: (linkId: string) => void },
) {
  const nodes = useMemo(() => chainFlowNodes(graph.nodes, positions), [graph.nodes, positions])
  const edges = useMemo(
    () => chainFlowEdges(graph.edges, { selectedLinkId, onSelect }),
    [graph.edges, selectedLinkId, onSelect],
  )
  return { nodes, edges }
}
