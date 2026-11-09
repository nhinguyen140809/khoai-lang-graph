'use client'

import { useStore } from '@xyflow/react'

import type { ChainGraph } from '@/modules/trace/entities'

import { useChainColumns } from '../hooks/useChainColumns'
import { chainNodeSize } from '../item-trace.constants'
import type { ChainPositions } from '../item-trace.types'

/**
 * The labels of the columns of the chain: over each column, set apart from its nodes, in bold, the
 * kinds of the items it holds, so a reader knows what a step of the chain is without reading every
 * node.
 * The labels sit in the coordinates of the graph and follow its viewport, so they zoom with it.
 */
export function ChainColumnLabels({
  graph,
  positions,
}: {
  graph: ChainGraph
  positions: ChainPositions
}) {
  const transform = useStore((state) => state.transform)
  const columns = useChainColumns(graph, positions)

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute"
        style={{
          transform: `translate(${String(transform[0])}px, ${String(transform[1])}px) scale(${String(transform[2])})`,
          transformOrigin: '0 0',
        }}
      >
        {columns.map((column) => (
          <span
            key={column.x}
            className="absolute -translate-x-1/2 text-sm font-semibold whitespace-nowrap text-foreground"
            style={{ left: column.x + chainNodeSize.width / 2, top: column.y - 44 }}
          >
            {column.kinds.join(', ')}
          </span>
        ))}
      </div>
    </div>
  )
}
