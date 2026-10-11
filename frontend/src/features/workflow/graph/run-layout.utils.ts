import type { WorkflowDefinitionEdge, WorkflowDefinitionNode } from '../definition.types'
import { layoutGraph } from './graph-layout.utils'

/**
 * The positions of one definition version. The graph is deterministic —
 * one row per stage — so the positions compute during render and are
 * memoized, no effect.
 */
export function useGraphLayout(
  nodes: WorkflowDefinitionNode[],
  edges: WorkflowDefinitionEdge[],
  stages: string[],
): Record<string, { x: number; y: number }> | null {
  if (nodes.length === 0) return null
  return layoutGraph(nodes, edges, stages)
}
