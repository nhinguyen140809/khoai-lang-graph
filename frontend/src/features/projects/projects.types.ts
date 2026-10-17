import { z } from 'zod'

import { type OutputLanguage, outputLanguages } from '@/shared/domain/output-language'
import { type RunStatus, runStatuses } from '@/shared/domain/run-status'

// Temporary hand-written schemas for the projects API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

export const projectStatusSchema = z.enum(['active', 'archived'])

export type ProjectStatus = z.infer<typeof projectStatusSchema>

/** Settings that runs start from; a field left empty takes the value of the next level. */
export const runDefaultsSchema = z.object({
  review_checkpoints: z.array(z.string()).nullable(),
  max_steps: z.number().int().nullable(),
  max_cost_usd: z.number().nullable(),
  parameters: z.record(z.string(), z.unknown()).nullable(),
})

export type RunDefaults = z.infer<typeof runDefaultsSchema>

export const projectSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  /** Null while the project waits for the agents to name it from its first message. */
  name: z.string().nullable(),
  description: z.string().nullable(),
  status: projectStatusSchema,
  output_language: z.enum(outputLanguages),
  run_config: runDefaultsSchema,
  initial_message_id: z.string().nullable(),
  model_overrides: z.record(z.string(), z.string()),
  /** Number of items per item kind. */
  item_counts: z.record(z.string(), z.number().int()),
  /** Number of unfinished runs per status; `interrupted` counts the reviews that wait. */
  unfinished_run_counts: z.object({
    queued: z.number().int(),
    running: z.number().int(),
    interrupted: z.number().int(),
  }),
  /**
   * The status that the latest runs of the threads of the project roll up to: the one that needs
   * the user most. Null before the first run.
   */
  rollup_run_status: z.enum(runStatuses).nullable(),
  last_activity_at: z.iso.datetime(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export type Project = z.infer<typeof projectSchema>

export interface CreateProjectBody {
  /** Null leaves the naming to the agents, from the first message of the project. */
  name: string | null
  output_language: OutputLanguage
}

// The answers of the requests that send the first message of a project, read for the ids only.

export const createdThreadSchema = z.object({ id: z.string() })

export const sentMessageSchema = z.object({
  message: z.object({ id: z.string() }),
  run: z.object({ id: z.string() }),
})

/** A value of the status filter of the project list: a rollup run status, or `none` without a run. */
export type ProjectRunFilter = RunStatus | 'none'

/** What the API narrows the list of projects to. */
export interface ProjectFilters {
  /** The projects whose rollup run status is one of these; every project when empty. */
  runStatuses: readonly ProjectRunFilter[]
  /** The projects with activity in this many days before now; null for any time. */
  activeWithinDays: number | null
}
