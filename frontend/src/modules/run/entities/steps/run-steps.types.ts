import { z } from 'zod'

import { itemRefSchema } from '@/modules/artifact/entities/@x/run'

import { runUsageSchema, stepNoteKinds } from '../runs/runs.types'

// Temporary hand-written schema for the steps of a run.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** The statuses of a step of a run. */
export const runStepStatuses = ['running', 'succeeded', 'failed', 'skipped'] as const

export type RunStepStatus = (typeof runStepStatuses)[number]

/** A short note of a step to the user, in Markdown. */
export const stepNoteSchema = z.object({
  kind: z.enum(stepNoteKinds),
  text: z.string(),
  created_at: z.iso.datetime(),
})

export type StepNote = z.infer<typeof stepNoteSchema>

/** One step of a run: a node of the workflow that ran, with what it used and produced. */
export const runStepSchema = z.object({
  id: z.string(),
  run_id: z.string(),
  sequence: z.number().int(),
  node: z.string(),
  agent_role: z.string().nullable(),
  stage: z.string(),
  status: z.enum(runStepStatuses),
  iteration: z.number().int(),
  subject_item_id: z.string().nullable(),
  model_id: z.string().nullable(),
  llm_calls: z.number().int(),
  usage: runUsageSchema,
  produced: z.array(itemRefSchema),
  // A step of a backend that sends no notes has none.
  notes: z.array(stepNoteSchema).default([]),
  error: z.string().nullable(),
  started_at: z.iso.datetime(),
  finished_at: z.iso.datetime().nullable(),
})

export type RunStep = z.infer<typeof runStepSchema>

/** One line of the steps of a run: a step, or steps on one subject that read as one. */
export type StepEntry =
  | { type: 'step'; step: RunStep }
  /** Consecutive steps on one subject, such as the turns of one interview. */
  | { type: 'group'; steps: RunStep[]; key: string }

/** What a node of the workflow graph is doing in a run; a node without a step is idle. */
export type NodeStatus = 'idle' | 'running' | 'waiting' | 'done' | 'failed'

export interface NodeProgress {
  status: NodeStatus
  /** Steps of this node in the run. */
  visits: number
  lastStepId: string | null
}

/** Where a run is in the graph of its workflow. */
export interface RunProgress {
  /** A node that is not in the map is idle. */
  nodes: Record<string, NodeProgress>
  /** The edge between the last two steps, null when they are of one node or there is one step. */
  lastEdge: { source: string; target: string } | null
}
