import { z } from 'zod'

import { runStatuses } from '@/lib/run-status.constants'

// Temporary hand-written schemas for the workflow definition and the runs.
// TODO: replace with the types generated into src/api/generated/ once they exist.

export const nodeKinds = ['start', 'end', 'agent', 'checkpoint', 'control'] as const

export type NodeKind = (typeof nodeKinds)[number]

export const definitionNodeSchema = z.object({
  id: z.string(),
  kind: z.enum(nodeKinds),
  label: z.string(),
  stage: z.string().optional(),
  agent_role: z.string().optional(),
  allow_edits: z.boolean().optional(),
  options: z
    .array(z.object({ key: z.string(), label: z.string(), approves: z.boolean() }))
    .optional(),
})

export type DefinitionNode = z.infer<typeof definitionNodeSchema>

export const definitionEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  label: z.string().nullable(),
  conditional: z.boolean(),
  option: z.string().nullable(),
})

export type DefinitionEdge = z.infer<typeof definitionEdgeSchema>

/** One version of the workflow definition: the graph, and the names that its parts have. */
export const workflowDefinitionSchema = z.object({
  name: z.string(),
  version: z.number().int(),
  nodes: z.array(definitionNodeSchema),
  edges: z.array(definitionEdgeSchema),
  stages: z.array(z.object({ key: z.string(), label: z.string() })),
  agent_roles: z.array(z.object({ key: z.string(), label: z.string() })),
})

export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>

export const usageSchema = z.object({
  input_tokens: z.number().int(),
  output_tokens: z.number().int(),
  cost_usd: z.number(),
  duration_ms: z.number().int(),
})

export const workflowRunSchema = z.object({
  id: z.string(),
  thread_id: z.string(),
  number: z.number().int(),
  status: z.enum(runStatuses),
  current_stage: z.string(),
  workflow_version: z.number().int(),
  step_count: z.number().int(),
  usage: usageSchema,
  trace_id: z.string().nullable(),
  error: z.object({ code: z.string(), message: z.string() }).nullable(),
  started_at: z.iso.datetime().nullable(),
  finished_at: z.iso.datetime().nullable(),
})

export type WorkflowRun = z.infer<typeof workflowRunSchema>

export const stepStatuses = ['running', 'succeeded', 'failed', 'skipped'] as const

export const workflowStepSchema = z.object({
  id: z.string(),
  run_id: z.string(),
  sequence: z.number().int(),
  node: z.string(),
  agent_role: z.string().nullable(),
  stage: z.string(),
  status: z.enum(stepStatuses),
  iteration: z.number().int(),
  subject_item_id: z.string().nullable(),
  model_id: z.string().nullable(),
  llm_calls: z.number().int(),
  usage: usageSchema,
  produced: z.array(
    z.object({ item_id: z.string(), kind: z.string(), key: z.string(), version: z.number().int() }),
  ),
  error: z.string().nullable(),
  started_at: z.iso.datetime(),
  finished_at: z.iso.datetime().nullable(),
})

export type WorkflowStep = z.infer<typeof workflowStepSchema>

/** The thread of a project; only its id is read. */
export const threadIdSchema = z.object({ id: z.string() })

export type NodeStatus = 'idle' | 'running' | 'waiting' | 'done' | 'failed'

export interface NodeProgress {
  status: NodeStatus
  /** Steps of this node in the run. */
  visits: number
  lastStepId: string | null
}

export interface RunProgress {
  /** A node that is not in the map is idle. */
  nodes: Record<string, NodeProgress>
  lastEdge: { source: string; target: string } | null
}
