import type { ItemRef } from '@/modules/artifact/entities/@x/run'

import type { RunStep, StepNote } from '../steps/run-steps.types'

/** What a line of the work of a run is doing: running, paused at a review, stopped with the run, done or failed. */
export type WorkStatus = 'running' | 'waiting' | 'stopped' | 'done' | 'failed'

/**
 * One phase of the work of a run: the steps that follow one another in one stage, on one subject
 * and in one round of rework, joined. A review that the run waits at ends a phase, and what the
 * work does next is a phase that continues it.
 */
export interface WorkEntry {
  /** The id of its first step, which anchors it in the chat. */
  id: string
  steps: RunStep[]
  stage: string
  node: string
  /** The nodes of its steps, each once, in the order they ran. */
  nodes: string[]
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
  /** Whether the line carries on a line of the same work that a message cut short. */
  continues: boolean
  /** When the line began; for a line that continues, when the message that cut the one before came. */
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
  /** Says that the line carries on the work above it; null for a line that starts the work. */
  continued: string | null
  /** Developer view: the steps, the model and the cost; empty in the user view. */
  details: string[]
  failure: string | null
}

/** The notes of one tool that came one after another in a line of work, as an entry of their own. */
export interface ToolUse {
  id: string
  /** The key of the tool. */
  tool: string
  notes: StepNote[]
  /** When its first note was written. */
  startedAt: string
  /** Whether the tool is in use now: the line that wrote it runs and has written nothing since. */
  isRunning: boolean
}

/** What a phase shows between its separator and its end: a note, or the use of a tool. */
export type PhaseItem =
  { type: 'note'; note: StepNote; isInProgress: boolean } | { type: 'tool'; use: ToolUse }

/** What a line of work shows for its notes: one note, or the notes of one tool in a row. */
export type NoteGroup =
  { type: 'note'; note: StepNote } | { type: 'tool'; tool: string; notes: StepNote[] }
