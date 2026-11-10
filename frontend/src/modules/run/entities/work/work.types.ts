import type { ItemRef } from '@/modules/artifact/entities/@x/run'

import type { RunStep, StepNote } from '../steps/run-steps.types'

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
  /** The notes its steps wrote while they worked, in the order written. */
  notes: StepNote[]
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
