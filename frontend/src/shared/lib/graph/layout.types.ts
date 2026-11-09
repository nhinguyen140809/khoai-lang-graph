/** The nodes and the edges of a graph that holds no positions of its own. */
export interface LayeredGraph {
  nodes: { id: string }[]
  edges: { source: string; target: string }[]
}

/** How a graph is laid out in layers. */
export interface LayeredLayoutOptions {
  /** The size that every node is laid out with. */
  width: number
  height: number
  /** Which way the layers read, as elkjs names it: DOWN the page, LEFT from the right, and so on. */
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
  /** The room between two layers, in pixels, where the edges run and their titles sit; 96 when absent. */
  layerSpacing?: number | undefined
}

/** The place of every node of a graph, by its id. */
export interface GraphLayout {
  positions: Record<string, { x: number; y: number }>
}
