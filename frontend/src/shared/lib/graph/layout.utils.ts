import type { GraphLayout, LayeredGraph, LayeredLayoutOptions } from './layout.types'

// Narrow enough for a graph to hold several layers at one zoom, wide enough for the title of an
// edge to sit on its line between two nodes; a graph with longer titles asks for more.
const DEFAULT_LAYER_SPACING = 96

/**
 * Places the nodes of a graph in layers, with elkjs. The graph holds no positions, so a node
 * added to it gets a place without a change here. The library is large and a graph is one page,
 * so it is loaded when the first graph is laid out.
 */
export async function layoutLayered(
  { nodes, edges }: LayeredGraph,
  { width, height, direction, layerSpacing = DEFAULT_LAYER_SPACING }: LayeredLayoutOptions,
): Promise<GraphLayout> {
  const { default: ELK } = await import('elkjs/lib/elk.bundled.js')
  const elk = new ELK()
  const known = new Set(nodes.map(({ id }) => id))
  const laidOut = await elk.layout({
    id: 'graph',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction,
      'elk.spacing.nodeNode': '36',
      'elk.layered.spacing.nodeNodeBetweenLayers': String(layerSpacing),
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    },
    children: nodes.map(({ id }) => ({ id, width, height })),
    edges: edges
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
