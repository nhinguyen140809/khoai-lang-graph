import type { WorkflowDefinitionEdge, WorkflowDefinitionNode } from '../definition.types'

// The layout of the run graph. The stages of the workflow definition name
// the pipeline order, so one stage is one row and the graph reads
// top-down like skeletons §7: the interview pair beside each other, the
// checkpoints between the stages they review. Positions are computed once
// per definition version; elkjs is not used because its cycle-heavy edge
// graph kept staggering the rows.

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

const ROW_GAP = 56
const COLUMN_GAP = 96

function layerOf(node: WorkflowDefinitionNode, stageIndex: Map<string, number>): number {
  if (node.kind === 'start') return 0
  if (node.kind === 'end') return (stageIndex.get('done') ?? stageIndex.size) + 1
  const stage = node.stage ?? null
  if (stage !== null && stageIndex.has(stage)) return (stageIndex.get(stage) ?? 0) + 1
  return stageIndex.size + 1
}

/** The position of every node: one row per stage of the pipeline, the
 * nodes of a row centered side by side (edge order does not matter, the
 * edges route around). */
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
  const maxWidth = Math.max(...nodes.map((node) => NODE_SIZES[node.kind]?.width ?? 160), 1)
  const virtualCenter = Math.max(maxWidth / 2, 220)
  for (const [layer, row] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    const y = layer * (NODE_SIZES.agent?.height ?? 44) + ROW_GAP
    const rowWidth = row.length * maxWidth + (row.length - 1) * (COLUMN_GAP - maxWidth)
    let x = virtualCenter - rowWidth / 2
    for (const node of row) {
      positions[node.id] = { x, y }
      x += (NODE_SIZES[node.kind] ?? { width: 160 }).width + (COLUMN_GAP - maxWidth)
    }
  }
  return positions
}
