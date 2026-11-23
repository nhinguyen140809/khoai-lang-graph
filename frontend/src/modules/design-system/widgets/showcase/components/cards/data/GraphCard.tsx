'use client'

import {
  Background,
  Controls,
  type EdgeProps,
  getBezierPath,
  type Node as FlowNode,
  type NodeOrigin,
  type NodeProps,
  Position,
} from '@xyflow/react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Code } from '@/shared/components/ui/code'
import { Edge } from '@/shared/components/ui/edge'
import { Flow } from '@/shared/components/ui/flow'
import { Handle } from '@/shared/components/ui/handle'
import { Node, NodeContent, NodeHeader, NodeHeaderTitle } from '@/shared/components/ui/node'
import { NodeStatusIndicator } from '@/shared/components/ui/node-status-indicator'
import { tones } from '@/shared/lib/tone'

import {
  type TraceEdge,
  traceEdges,
  type TraceNode,
  traceNodes,
} from '../../design-system.fixtures'
import { SampleGroup, SampleLabel } from '../Sample'

const nodeVariants = ['outline', 'soft', 'solid'] as const
const edgeVariants = ['solid', 'dashed', 'dotted'] as const
const edgeWeights = ['thin', 'regular', 'strong'] as const

function TraceItemNode({ data }: NodeProps<TraceNode>) {
  return (
    <NodeStatusIndicator status={data.status}>
      <Node variant={data.variant} color={data.color} className="w-36">
        <NodeHeader>
          <NodeHeaderTitle className="font-mono">{data.key}</NodeHeaderTitle>
        </NodeHeader>
        <NodeContent className="pt-1">{data.title}</NodeContent>
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
      </Node>
    </NodeStatusIndicator>
  )
}

function LinkEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  label,
  data,
}: EdgeProps<TraceEdge>) {
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
      variant={data?.variant}
      weight={data?.weight}
      color={data?.color}
      arrow
    />
  )
}

type SamplePoint = FlowNode<Record<string, never>, 'point'>
type SampleCaption = FlowNode<{ label: string }, 'caption'>

// The end of a sample edge.
function PointNode() {
  return (
    <div className="size-1.5 rounded-full bg-muted-foreground">
      <Handle type="source" position={Position.Right} className="invisible" />
      <Handle type="target" position={Position.Left} className="invisible" />
    </div>
  )
}

function CaptionNode({ data }: NodeProps<SampleCaption>) {
  return <SampleLabel>{data.label}</SampleLabel>
}

// Defined once, outside the component, so that React Flow does not remount the nodes and edges.
const nodeTypes = { item: TraceItemNode, point: PointNode, caption: CaptionNode }
const edgeTypes = { link: LinkEdge }

// One row per color and one column per line style, each edge between two points. The grid is
// narrow enough for the card to show it at 1x zoom or more, so that the 1px lines stay sharp.
const COLUMN_WIDTH = 80
const EDGE_LENGTH = 56
const ROW_HEIGHT = 24

function point(id: string, x: number, y: number): SamplePoint {
  return { id, type: 'point', position: { x, y }, data: {}, selectable: false }
}

function caption(label: string, x: number, y: number, origin: NodeOrigin): SampleCaption {
  const id = `${label}-caption`
  return { id, type: 'caption', position: { x, y }, origin, data: { label }, selectable: false }
}

const edgeSampleNodes: (SamplePoint | SampleCaption)[] = [
  ...edgeVariants.map((variant, column) =>
    caption(variant, column * COLUMN_WIDTH + EDGE_LENGTH / 2, -12, [0.5, 1]),
  ),
  ...tones.flatMap((color, row) => [
    caption(color, -16, row * ROW_HEIGHT, [1, 0.5]),
    ...edgeVariants.flatMap((variant, column) => [
      point(`${variant}-${color}-from`, column * COLUMN_WIDTH, row * ROW_HEIGHT),
      point(`${variant}-${color}-to`, column * COLUMN_WIDTH + EDGE_LENGTH, row * ROW_HEIGHT),
    ]),
  ]),
  // One more row for the weights of an edge, under the colors.
  caption('weight', -16, tones.length * ROW_HEIGHT, [1, 0.5]),
  ...edgeWeights.flatMap((weight, column) => [
    point(`weight-${weight}-from`, column * COLUMN_WIDTH, tones.length * ROW_HEIGHT),
    point(`weight-${weight}-to`, column * COLUMN_WIDTH + EDGE_LENGTH, tones.length * ROW_HEIGHT),
  ]),
]

const edgeSampleEdges: TraceEdge[] = [
  ...tones.flatMap((color): TraceEdge[] =>
    edgeVariants.map((variant) => ({
      id: `${variant}-${color}`,
      type: 'link',
      source: `${variant}-${color}-from`,
      target: `${variant}-${color}-to`,
      data: { variant, color },
    })),
  ),
  ...edgeWeights.map((weight): TraceEdge => ({
    id: `weight-${weight}`,
    type: 'link',
    source: `weight-${weight}-from`,
    target: `weight-${weight}-to`,
    data: { variant: 'solid', color: 'neutral', weight },
  })),
]

export function GraphCard() {
  return (
    <Card className="gap-0">
      <CardHeader className="border-b pb-3">
        <CardTitle>Trace graph</CardTitle>
        <CardDescription>
          Nodes take <Code>variant</Code> and <Code>color</Code> like badges, edges a line style, a
          weight and a color; the ring shows the run status (REQ-001 is loading).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-0">
        <div className="h-80 border-b bg-background">
          <Flow
            defaultNodes={traceNodes}
            defaultEdges={traceEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
          >
            <Background />
            <Controls showInteractive={false} />
          </Flow>
        </div>
        {nodeVariants.map((variant) => (
          <SampleGroup key={variant} label={variant} className="px-4">
            <div className="flex flex-wrap gap-1.5">
              {tones.map((color) => (
                <Node key={color} variant={variant} color={color}>
                  <NodeHeader className="mb-0 px-2 py-1">
                    <NodeHeaderTitle>{color}</NodeHeaderTitle>
                  </NodeHeader>
                </Node>
              ))}
            </div>
          </SampleGroup>
        ))}
        <SampleGroup label="edges" className="px-4">
          <div className="h-64 rounded-md border bg-background">
            <Flow
              defaultNodes={edgeSampleNodes}
              defaultEdges={edgeSampleEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              nodeOrigin={[0.5, 0.5]}
              nodesDraggable={false}
              nodesConnectable={false}
              panOnDrag={false}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              preventScrolling={false}
              fitView
            />
          </div>
        </SampleGroup>
      </CardContent>
    </Card>
  )
}
