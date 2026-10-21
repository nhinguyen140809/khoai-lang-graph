import { z } from 'zod'

import { runDefaultsSchema, type RunStatus, runStatuses } from '@/modules/run/entities/@x/project'
import { type OutputLanguage, outputLanguages } from '@/shared/config/output-language'

// Temporary hand-written schemas for the projects API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

export const projectStatusSchema = z.enum(['active', 'archived'])

export type ProjectStatus = z.infer<typeof projectStatusSchema>

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

/** A value of the status filter of the project list: a rollup run status, or `none` without a run. */
export type ProjectRunFilter = RunStatus | 'none'

/** What the API narrows the list of projects to. */
export interface ProjectFilters {
  /** The projects whose rollup run status is one of these; every project when empty. */
  runStatuses: readonly ProjectRunFilter[]
  /** The projects with activity in this many days before now; null for any time. */
  activeWithinDays: number | null
}
