'use client'

import {
  Background,
  Controls,
  type Edge as FlowEdge,
  type EdgeProps,
  getBezierPath,
  type Node as FlowNode,
  type NodeProps,
  Position,
} from '@xyflow/react'
import { useMemo } from 'react'

import { Edge } from '@/components/ui/edge'
import { Flow } from '@/components/ui/flow'
import { Handle } from '@/components/ui/handle'
import {
  Node,
  NodeContent,
  NodeHeader,
  NodeHeaderTitle,
  type NodeVariant,
} from '@/components/ui/node'
import {
  type NodeStatus as RingStatus,
  NodeStatusIndicator,
} from '@/components/ui/node-status-indicator'
import type { GraphTone } from '@/lib/tone.constants'

import { edgeId, type GraphLayout, NODE_HEIGHT, NODE_WIDTH } from '../graph-layout.utils'
import type { NodeKind, NodeStatus, RunProgress, WorkflowDefinition } from '../workflow.types'

interface NodeData extends Record<string, unknown> {
  label: string
  kind: NodeKind
  detail: string
  status: NodeStatus
  visits: number
}

type GraphNode = FlowNode<NodeData, 'workflow'>

// The start and end nodes are smaller than the others.
const TERMINAL_NODE_WIDTH = 110
const TERMINAL_NODE_HEIGHT = 28

interface EdgeData extends Record<string, unknown> {
  conditional: boolean
  last: boolean
}

type GraphEdge = FlowEdge<EdgeData, 'flow'>

// How each kind of node looks: the fill and the tone that its kind names.
const kindStyles: Record<NodeKind, { variant: NodeVariant; color: GraphTone }> = {
  start: { variant: 'solid', color: 'neutral' },
  end: { variant: 'solid', color: 'neutral' },
  agent: { variant: 'outline', color: 'neutral' },
  checkpoint: { variant: 'soft', color: 'warning' },
  control: { variant: 'soft', color: 'chart-3' },
}

// The ring that shows what a node did in the run.
const ringOf: Record<NodeStatus, RingStatus> = {
  idle: 'initial',
  running: 'loading',
  waiting: 'warning',
  done: 'success',
  failed: 'error',
}

const statusLabels: Record<NodeStatus, string> = {
  idle: 'not reached',
  running: 'running',
  waiting: 'waiting',
  done: 'done',
  failed: 'failed',
}

function WorkflowNodeView({ data, selected }: NodeProps<GraphNode>) {
  const style = kindStyles[data.kind]
  const terminal = data.kind === 'start' || data.kind === 'end'
  return (
    <NodeStatusIndicator status={ringOf[data.status]}>
      <Node
        variant={style.variant}
        color={style.color}
        data-selected={selected}
        aria-label={`${data.label}, ${statusLabels[data.status]}${data.visits > 1 ? `, ${String(data.visits)} visits` : ''}`}
        style={{
          width: terminal ? TERMINAL_NODE_WIDTH : NODE_WIDTH,
          minHeight: terminal ? TERMINAL_NODE_HEIGHT : NODE_HEIGHT,
        }}
      >
        <NodeHeader className={terminal ? 'mb-0 justify-center' : undefined}>
          <NodeHeaderTitle className="truncate font-mono">{data.label}</NodeHeaderTitle>
          {data.visits > 1 && (
            <span className="font-mono text-3xs text-muted-foreground">x{data.visits}</span>
          )}
        </NodeHeader>
        {!terminal && (
          <NodeContent className="pt-0.5 text-2xs text-muted-foreground">
            {data.detail} {data.status !== 'idle' && <>- {statusLabels[data.status]}</>}
          </NodeContent>
        )}
        {data.kind !== 'start' && <Handle type="target" position={Position.Top} />}
        {data.kind !== 'end' && <Handle type="source" position={Position.Bottom} />}
      </Node>
    </NodeStatusIndicator>
  )
}

function WorkflowEdgeView({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  label,
  data,
}: EdgeProps<GraphEdge>) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })
  return (
    <Edge
      id={id}
      path={path}
      label={label}
      labelX={labelX}
      labelY={labelY}
      variant={data?.conditional === true ? 'dashed' : 'solid'}
      color={data?.last === true ? 'primary' : 'neutral'}
    />
  )
}

// Defined once, outside the component, so that React Flow does not remount the nodes and edges.
const nodeTypes = { workflow: WorkflowNodeView }
const edgeTypes = { flow: WorkflowEdgeView }

interface WorkflowGraphProps {
  definition: WorkflowDefinition
  layout: GraphLayout
  progress: RunProgress
  /** The node whose step is shown below the graph. */
  selectedNode: string | null
  onSelectNode: (nodeId: string) => void
}

/** The graph of a workflow definition, with the state of every node in a run. */
export function WorkflowGraph({
  definition,
  layout,
  progress,
  selectedNode,
  onSelectNode,
}: WorkflowGraphProps) {
  const stageLabels = useMemo(
    () => new Map(definition.stages.map(({ key, label }) => [key, label])),
    [definition.stages],
  )

  const nodes = useMemo<GraphNode[]>(
    () =>
      definition.nodes.map((node) => {
        const progressOfNode = progress.nodes[node.id]
        return {
          id: node.id,
          type: 'workflow',
          position: layout.positions[node.id] ?? { x: 0, y: 0 },
          selected: node.id === selectedNode,
          draggable: false,
          connectable: false,
          data: {
            label: node.label,
            kind: node.kind,
            detail: node.stage === undefined ? '' : (stageLabels.get(node.stage) ?? node.stage),
            status: progressOfNode?.status ?? 'idle',
            visits: progressOfNode?.visits ?? 0,
          },
        }
      }),
    [definition.nodes, layout.positions, progress.nodes, selectedNode, stageLabels],
  )

  const edges = useMemo<GraphEdge[]>(
    () =>
      definition.edges.map((edge, index) => ({
        id: edgeId(edge, index),
        type: 'flow',
        source: edge.source,
        target: edge.target,
        ...(edge.label !== null && { label: edge.label }),
        data: {
          conditional: edge.conditional,
          last:
            progress.lastEdge?.source === edge.source && progress.lastEdge.target === edge.target,
        },
      })),
    [definition.edges, progress.lastEdge],
  )

  return (
    <Flow<GraphNode, GraphEdge>
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      onNodeClick={(_event, node) => {
        onSelectNode(node.id)
      }}
      fitView
      minZoom={0.2}
    >
      <Background />
      <Controls showInteractive={false} />
    </Flow>
  )
}
