'use client'

import { Background, Controls, MiniMap } from '@xyflow/react'

import { useOpenItemActions } from '@/modules/artifact/features/open-item'
import { useProjectId } from '@/modules/project/entities'
import type { ChainGraph } from '@/modules/trace/entities'
import { useViewTraceAction } from '@/modules/trace/features/view-trace'
import { Flow } from '@/shared/components/ui/flow'

import { useChainFlow } from '../hooks/useChainFlow'
import { chainFromNodeCount } from '../item-trace.constants'
import type { ChainFlowEdge, ChainFlowNode, ChainPositions } from '../item-trace.types'
import { ChainColumnLabels } from './ChainColumnLabels'
import { ChainEdgeLine } from './ChainEdgeLine'
import { ChainNodeCard } from './ChainNodeCard'

/** The types of the nodes and edges of the canvas, defined once so they never remount. */
const chainNodeTypes = { chain: ChainNodeCard }
const chainEdgeTypes = { chain: ChainEdgeLine }

interface ChainCanvasProps {
  graph: ChainGraph
  /** The places of the nodes of the graph, from the layout. */
  positions: ChainPositions
  selectedLinkId: string | null
  onSelect: (linkId: string) => void
  onClear: () => void
  fitDuration: number
  /** What the key of Escape does inside the canvas, where the focus of the graph sits. */
  onEscape: () => void
}

/** The canvas of the chain: its nodes and edges drawn from the graph and its layout. */
export function ChainCanvas({
  graph,
  positions,
  selectedLinkId,
  onSelect,
  onClear,
  fitDuration,
  onEscape,
}: ChainCanvasProps) {
  const projectId = useProjectId()
  const openActionsOf = useOpenItemActions(projectId)
  const viewTraceOf = useViewTraceAction(projectId)
  const { nodes, edges } = useChainFlow(graph, positions, { selectedLinkId, onSelect })

  return (
    <Flow<ChainFlowNode, ChainFlowEdge>
      nodes={nodes}
      edges={edges}
      nodeTypes={chainNodeTypes}
      edgeTypes={chainEdgeTypes}
      nodesFocusable
      edgesFocusable
      onlyRenderVisibleElements={nodes.length >= chainFromNodeCount.visibleOnly}
      zoomOnScroll={false}
      preventScrolling={false}
      fitView
      fitViewOptions={{ duration: fitDuration, maxZoom: 1 }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onEscape()
      }}
      onPaneClick={onClear}
      onNodeClick={(_, node) => {
        onClear()
        openActionsOf({ id: node.id, title: node.data.title }).open.run()
      }}
      onNodeDoubleClick={(_, node) => {
        viewTraceOf({ id: node.id, title: node.data.title }).run()
      }}
      onEdgeClick={(_, edge) => {
        onSelect(edge.id)
      }}
      onEdgeContextMenu={(_, edge) => {
        onSelect(edge.id)
      }}
    >
      <Background />
      <Controls showInteractive={false} position="bottom-left" />
      <ChainColumnLabels graph={graph} positions={positions} />
      {nodes.length >= chainFromNodeCount.minimap && <MiniMap pannable zoomable />}
    </Flow>
  )
}
