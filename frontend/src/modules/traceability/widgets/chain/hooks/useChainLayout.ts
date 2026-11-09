'use client'

import { useQuery } from '@tanstack/react-query'

import { type ChainGraph, chainKeys } from '@/modules/trace/entities'
import { layoutLayered } from '@/shared/lib/graph'

import { chainGaps, chainNodeSize } from '../item-trace.constants'
import type { ChainPositions } from '../item-trace.types'

/**
 * The places of the nodes of the chain, laid out in layers once per set of node and edge ids, with
 * elkjs loaded on the first use: the targets of the links, the interviews, sit on the left. Every
 * node takes one size, so nothing on the canvas moves when a link is chosen. While it lays out the
 * answer is pending; a failure offers to try again.
 */
export function useChainLayout(
  graph: ChainGraph | undefined,
):
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; positions: ChainPositions } {
  const nodes = graph?.nodes ?? []
  const edges = graph?.edges ?? []
  const layout = useQuery({
    queryKey: chainKeys.layout(
      nodes.map(({ id }) => id),
      edges.map(({ id }) => id),
    ),
    queryFn: () =>
      layoutLayered(
        { nodes, edges: edges.map(({ source, target }) => ({ source, target })) },
        {
          width: chainNodeSize.width,
          height: chainNodeSize.height,
          direction: 'LEFT',
          layerSpacing: chainGaps.layer,
        },
      ),
    enabled: graph !== undefined,
  })

  if (layout.isError) return { state: 'error', retry: () => void layout.refetch() }
  if (layout.data === undefined) return { state: 'pending' }
  return { state: 'success', positions: layout.data.positions }
}
