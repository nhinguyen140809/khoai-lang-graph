import type { WorkflowDefinition } from './workflow.types'

/** The size that every node of the graph is laid out with. */
export const NODE_WIDTH = 190
export const NODE_HEIGHT = 56

export interface GraphLayout {
  positions: Record<string, { x: number; y: number }>
}

/**
 * Places the nodes of a workflow definition in layers, top to bottom, with elkjs. The definition
 * has no positions, so a node that is added to it gets a place without a change here. The library
 * is large and the graph is one page, so it is loaded when the first graph is laid out.
 */
export async function layoutGraph(definition: WorkflowDefinition): Promise<GraphLayout> {
  const { default: ELK } = await import('elkjs/lib/elk.bundled.js')
  const elk = new ELK()
  const known = new Set(definition.nodes.map(({ id }) => id))
  const laidOut = await elk.layout({
    id: 'workflow',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '36',
      'elk.layered.spacing.nodeNodeBetweenLayers': '52',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    },
    children: definition.nodes.map(({ id }) => ({ id, width: NODE_WIDTH, height: NODE_HEIGHT })),
    edges: definition.edges
      .filter(({ source, target }) => known.has(source) && known.has(target))
      .map(({ source, target }, index) => ({
        id: `edge-${String(index)}`,
        sources: [source],
        targets: [target],
      })),
  })
  const positions: GraphLayout['positions'] = {}
  for (const child of laidOut.children ?? []) {
    positions[child.id] = { x: child.x ?? 0, y: child.y ?? 0 }
  }
  return { positions }
}

/** The id of an edge: the two nodes and the option, which tells apart two edges between them. */
export function edgeId(
  edge: { source: string; target: string; option: string | null },
  index: number,
): string {
  return `${edge.source}:${edge.target}:${edge.option ?? ''}:${String(index)}`
}
