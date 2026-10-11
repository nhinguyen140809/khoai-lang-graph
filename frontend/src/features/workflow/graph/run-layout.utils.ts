import { useEffect, useState } from 'react'

import type { WorkflowDefinitionEdge, WorkflowDefinitionNode } from '../definition.types'
import { layoutGraph } from './graph-layout.utils'

/** The elkjs positions of one definition version, computed once. */
export function useGraphLayout(nodes: WorkflowDefinitionNode[], edges: WorkflowDefinitionEdge[]) {
  const [layout, setLayout] = useState<Record<string, { x: number; y: number }> | null>(null)
  useEffect(() => {
    let cancelled = false
    if (nodes.length === 0) return
    void layoutGraph(nodes, edges).then((positions) => {
      if (!cancelled) setLayout(positions)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the definition itself
  }, [nodes, edges])
  return layout
}
