import type { WorkflowDefinitionEdge, WorkflowDefinitionNode } from '../definition.types'

// The layout of the run graph: one row per stage of the pipeline (the
// stage list of the workflow definition), each row far enough from the
// next for the Node cards (56-85px tall in the browser) never to overlap.
// The interview pair and their control node sit side by side with room
// for their ~200px cards.

export interface Position {
  x: number
  y: number
}

const ROW_HEIGHT = 100
const NODE_WIDTH = 192
const IN_ROW_GAP = 48
const CENTER_X = 320

function layerOf(node: WorkflowDefinitionNode, stageIndex: Map<string, number>): number {
  if (node.kind === 'start') return 0
  if (node.kind === 'end') return (stageIndex.get('done') ?? stageIndex.size) + 1
  const stage = node.stage ?? null
  if (stage !== null && stageIndex.has(stage)) return (stageIndex.get(stage) ?? 0) + 1
  return stageIndex.size + 1
}

export function layoutGraph(
  nodes: WorkflowDefinitionNode[],
  _edges: WorkflowDefinitionEdge[],
  stages: string[],
): Record<string, Position> {
  const stageIndex = new Map(stages.map((stage, index) => [stage, index]))
  const rows = new Map<number, WorkflowDefinitionNode[]>()
  for (const node of nodes) {
    const layer = layerOf(node, stageIndex)
    const row = rows.get(layer)
    if (row) row.push(node)
    else rows.set(layer, [node])
  }

  const positions: Record<string, Position> = {}
  const step = NODE_WIDTH + IN_ROW_GAP

  for (const [layer, row] of rows) {
    const y = layer * ROW_HEIGHT
    const startX = CENTER_X - (row.length * step - IN_ROW_GAP) / 2
    row.forEach((node, index) => {
      positions[node.id] = { x: startX + index * step, y }
    })
  }
  return positions
}
