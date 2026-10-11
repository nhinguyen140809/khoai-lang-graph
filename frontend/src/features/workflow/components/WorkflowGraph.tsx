'use client'

import {
  Background,
  BackgroundVariant,
  Controls,
  type EdgeProps,
  getBezierPath,
  type Node as FlowNode,
  type NodeProps,
  Position,
} from '@xyflow/react'

import { Edge } from '@/components/ui/edge'
import { Flow } from '@/components/ui/flow'
import { Handle } from '@/components/ui/handle'
import { Node, NodeContent, NodeHeader, NodeHeaderTitle } from '@/components/ui/node'
import {
  type NodeStatus as RingStatus,
  NodeStatusIndicator,
} from '@/components/ui/node-status-indicator'
import { cn } from '@/lib/utils'

import type { WorkflowDefinitionEdge, WorkflowDefinitionNode } from '../definition.types'
import type { NodeProgress, RunProgress } from '../graph/node-status.reducer'
import type { RunStep } from '../workflow.types'

// The graph of the run (skeletons §7): `[ ]` an agent node, `< >` a
// checkpoint, `( )` a control node, with the state of each node and its
// visit count when it ran more than once. The last edge taken is drawn
// emphasized; clicking a node opens its steps.

export interface WorkflowNodeData extends Record<string, unknown> {
  definition: WorkflowDefinitionNode
  progress: NodeProgress
  steps: RunStep[]
}

export interface WorkflowEdgeData extends Record<string, unknown> {
  conditional: boolean
  option: string | null
  last: boolean
}

type WorkflowFlowNode = FlowNode<WorkflowNodeData, 'workflow'>
import { type Edge as FlowEdge } from '@xyflow/react'

type WorkflowFlowEdge = FlowEdge<WorkflowEdgeData, 'workflow'>

function statusOf(progress: NodeProgress | undefined) {
  if (progress === undefined) return 'idle' as const
  return progress.status
}

function WorkflowNodeView({ data, selected }: NodeProps<WorkflowFlowNode>) {
  const { definition, progress } = data
  const status = statusOf(progress)
  const visited = progress.visits
  const ring: Record<typeof status, RingStatus> = {
    idle: 'initial',
    running: 'loading',
    waiting: 'warning',
    done: 'success',
    failed: 'error',
  }
  return (
    <NodeStatusIndicator status={ring[status]}>
      <Node
        variant="soft"
        color="primary"
        className={cn(
          'w-44',
          definition.kind === 'checkpoint' && 'w-52',
          selected && 'ring-2 ring-ring/50',
        )}
      >
        <NodeHeader>
          <NodeHeaderTitle className="font-mono text-xs">
            {definition.kind === 'agent' ? `[ ${definition.label} ]` : null}
            {definition.kind === 'checkpoint' ? `< ${definition.label} >` : null}
            {definition.kind === 'control' ? `( ${definition.label} )` : null}
            {definition.kind === 'start' || definition.kind === 'end'
              ? `[ ${definition.label} ]`
              : null}
            {visited > 1 ? (
              <span className="ml-1 text-muted-foreground">x{String(visited)}</span>
            ) : null}
          </NodeHeaderTitle>
        </NodeHeader>
        {definition.stage ? (
          <NodeContent className="pt-1 text-xs text-muted-foreground">
            {definition.stage}
          </NodeContent>
        ) : null}
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
      </Node>
    </NodeStatusIndicator>
  )
}

function WorkflowEdgeView({
  id: _id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
}: EdgeProps<WorkflowFlowEdge>) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })
  return (
    <>
      <Edge
        id={_id}
        path={path}
        label={label}
        labelX={labelX}
        labelY={labelY}
        variant={data?.conditional ? 'dashed' : 'solid'}
        className={data?.last ? 'stroke-2' : undefined}
      />
    </>
  )
}

const nodeTypes = { workflow: WorkflowNodeView }
const edgeTypes = { workflow: WorkflowEdgeView }

interface WorkflowGraphProps {
  nodes: WorkflowDefinitionNode[]
  edges: WorkflowDefinitionEdge[]
  progress: RunProgress
  steps: RunStep[]
  layout: Record<string, { x: number; y: number }>
  onNodeSelect: (node: string) => void
}

export function WorkflowGraph({
  nodes,
  edges,
  progress,
  steps,
  layout,
  onNodeSelect,
}: WorkflowGraphProps) {
  const flowNodes: WorkflowFlowNode[] = nodes.map((definition) => ({
    id: definition.id,
    type: 'workflow',
    position: layout[definition.id] ?? { x: 0, y: 0 },
    data: {
      definition,
      progress: progress.nodes[definition.id] ?? {
        status: 'idle',
        visits: 0,
        lastStepId: null,
      },
      steps: steps.filter((step) => step.node === definition.id),
    },
  }))
  const flowEdges: WorkflowFlowEdge[] = edges.map((edge, index) => ({
    id: `${edge.source}:${edge.target}:${edge.option ?? 'any'}:${String(index)}`,
    source: edge.source,
    target: edge.target,
    type: 'workflow',
    label: edge.label ?? undefined,
    data: {
      conditional: edge.conditional ?? false,
      option: edge.option ?? null,
      last:
        progress.lastEdge !== null &&
        progress.lastEdge.source === edge.source &&
        progress.lastEdge.target === edge.target,
    },
  }))

  return (
    <Flow<WorkflowFlowNode, WorkflowFlowEdge>
      nodes={flowNodes}
      edges={flowEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={(_event, node) => {
        onNodeSelect(node.id)
      }}
      fitView
      className="h-[420px] w-full"
    >
      <Background variant={BackgroundVariant.Dots} gap={24} />
      <Controls showInteractive={false} />
    </Flow>
  )
}
