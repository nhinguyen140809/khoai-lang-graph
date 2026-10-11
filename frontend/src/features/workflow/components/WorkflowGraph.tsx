'use client'

import {
  Background,
  BackgroundVariant,
  Controls,
  type EdgeProps,
  getSmoothStepPath,
  MiniMap,
  type Node as FlowNode,
  type NodeProps,
  Position,
} from '@xyflow/react'

import { Badge } from '@/components/ui/badge'
import { Edge } from '@/components/ui/edge'
import { Flow } from '@/components/ui/flow'
import { Handle } from '@/components/ui/handle'
import { Node, NodeContent, NodeHeader, NodeHeaderTitle } from '@/components/ui/node'
import { NodeStatusIndicator } from '@/components/ui/node-status-indicator'
import { cn } from '@/lib/utils'
import type { Tone } from '@/lib/tone.constants'

import type { WorkflowDefinitionEdge, WorkflowDefinitionNode } from '../definition.types'
import type { NodeProgress, RunProgress } from '../graph/node-status.reducer'
import type { RunStep } from '../workflow.types'

// The graph of the run (skeletons §7), drawn with the design system's
// Node, Edge, Handle and status ring components: an agent card colored
// primary, a checkpoint card colored warning, a control node neutral,
// each ringed with its state and carrying its visit count as a badge in
// the header — the last edge taken painted solid success, conditional
// edges dashed with their option as label.

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
type WorkflowFlowEdge = import('@xyflow/react').Edge<WorkflowEdgeData, 'workflow'>

function kindTone(kind: string): Tone {
  if (kind === 'checkpoint') return 'warning'
  if (kind === 'control') return 'neutral'
  if (kind === 'start' || kind === 'end') return 'success'
  return 'primary'
}

const ringStatus: Record<string, 'initial' | 'loading' | 'warning' | 'success' | 'error'> = {
  idle: 'initial',
  running: 'loading',
  waiting: 'warning',
  done: 'success',
  failed: 'error',
}

function WorkflowNodeView({ data, selected }: NodeProps<WorkflowFlowNode>) {
  const { definition, progress } = data
  const visited = progress.visits
  const status = progress.status
  const tone = kindTone(definition.kind)
  const open = definition.kind === 'checkpoint' ? '< ' : definition.kind === 'control' ? '( ' : '[ '
  const close = definition.kind === 'checkpoint' ? ' >' : definition.kind === 'control' ? ' )' : ' ]'

  return (
    <NodeStatusIndicator status={ringStatus[status] ?? 'initial'}>
      <Node
        variant={status === 'idle' ? 'outline' : 'soft'}
        color={tone}
        className={cn('w-44', definition.kind === 'checkpoint' && 'w-52', selected && 'flow-selected')}
      >
        <NodeHeader>
          <NodeHeaderTitle className="font-mono text-xs">
            {open}
            {definition.label}
            {close}
          </NodeHeaderTitle>
          {visited > 1 ? (
            <Badge variant="outline" className="ml-auto shrink-0 text-[0.5625rem]">
              x{String(visited)}
            </Badge>
          ) : null}
        </NodeHeader>
        {definition.stage ? (
          <NodeContent className="pt-0.5 text-[0.6875rem] text-muted-foreground">
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
  id: edgeId,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  label,
  data,
}: EdgeProps<WorkflowFlowEdge>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })
  const isLast = data?.last ?? false
  const isConditional = data?.conditional ?? false
  return (
    <Edge
      id={edgeId}
      path={path}
      label={isConditional ? label : null}
      labelX={labelX}
      labelY={labelY}
      variant={isLast ? 'solid' : isConditional ? 'dashed' : 'solid'}
      color={isLast ? 'success' : undefined}
      className={isLast ? 'stroke-2' : !isLast && !isConditional && 'opacity-30'}
    />
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
        status: 'idle' as const,
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
    <div style={{ height: 640 }} className="w-full overflow-hidden rounded-lg border bg-card">
      <Flow<WorkflowFlowNode, WorkflowFlowEdge>
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_event, node) => {
          onNodeSelect(node.id)
        }}
        fitView
        fitViewOptions={{ padding: 0.1, maxZoom: 0.75 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={32} size={1.2} />
        <Controls showInteractive={false} />
        <MiniMap
          className="!bottom-2 !left-2 rounded-md"
          maskColor="color-mix(in oklab, var(--background) 75%, transparent)"
          pannable
          zoomable
        />
      </Flow>
    </div>
  )
}
