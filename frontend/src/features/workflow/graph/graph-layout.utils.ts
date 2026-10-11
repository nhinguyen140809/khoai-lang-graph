// elkjs lays the workflow graph out once per definition version
// (docs/architecture/web-app.md §3): the definition has no positions, so a
// node added in the backend gets a place without a client change.
import ELK from 'elkjs/lib/elk.bundled.js'

import type { WorkflowDefinitionEdge, WorkflowDefinitionNode } from '../definition.types'

const NODE_SIZES: Record<string, { width: number; height: number }> = {
  start: { width: 96, height: 40 },
  end: { width: 96, height: 40 },
  agent: { width: 176, height: 44 },
  checkpoint: { width: 200, height: 44 },
  control: { width: 160, height: 40 },
}

export interface Position {
  x: number
  y: number
}

const elk = new ELK()

/** The layered (top-down) position of every node, computed by elkjs. */
export async function layoutGraph(
  nodes: WorkflowDefinitionNode[],
  edges: WorkflowDefinitionEdge[],
): Promise<Record<string, Position>> {
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.edgeRouting': 'SPLINES',
      'elk.spacing.nodeNode': '40',
      'elk.layerSpacing': '60',
      'elk.separateConnectedComponents': 'true',
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: NODE_SIZES[node.kind]?.width ?? 160,
      height: NODE_SIZES[node.kind]?.height ?? 40,
    })),
    edges: edges.map((edge, index) => ({
      id: `${edge.source}:${edge.target}:${edge.option ?? ''}:${String(index)}`,
      sources: [edge.source],
      targets: [edge.target],
    })),
  }
  const laid = await elk.layout(graph)
  const positions: Record<string, Position> = {}
  for (const child of laid.children ?? []) {
    positions[child.id] = { x: child.x ?? 0, y: child.y ?? 0 }
  }
  return positions
}
