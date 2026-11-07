import { z } from 'zod'

import { type ItemRef, itemRefSchema } from '@/modules/artifact/entities/@x/run'

import { runUsageSchema } from '../runs/runs.types'

// Temporary hand-written schema for the steps of a run.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** The statuses of a step of a run. */
export const runStepStatuses = ['running', 'succeeded', 'failed', 'skipped'] as const

export type RunStepStatus = (typeof runStepStatuses)[number]

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

/** What a line of the work of a run is doing: running, paused at a review, stopped with the run, done or failed. */
export type WorkStatus = 'running' | 'waiting' | 'stopped' | 'done' | 'failed'

/** One line of the work of a run: a step of an agent, or its steps on one subject joined. */
export interface WorkEntry {
  /** The id of its first step, which anchors it in the chat. */
  id: string
  steps: RunStep[]
  stage: string
  node: string
  agentRole: string
  /** The model of its last step, after the fallbacks. */
  modelId: string | null
  /** The rework round of its first step; 0 for the first round. */
  iteration: number
  /** The item that its steps work on, such as the persona of an interview; null without one. */
  subjectItemId: string | null
  /** The key of that item, from what the steps produced; null without one. */
  subjectKey: string | null
  status: WorkStatus
  startedAt: string
  /** Null while a step runs. */
  durationMs: number | null
  costUsd: number
  /** The items that its steps created, each once at its last version. */
  created: ItemRef[]
  /** The items that its steps changed, each once at its last version. */
  changed: ItemRef[]
  /** The error of its failed step; null when none failed. */
  error: string | null
}

/** The words of the parts of a line of work in the view of the app; null for a part it does not show. */
export interface WorkWords {
  status: string | null
  round: string | null
  took: string | null
  writes: string | null
  /** Developer view: the steps, the model and the cost; empty in the user view. */
  details: string[]
  failure: string | null
}

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
