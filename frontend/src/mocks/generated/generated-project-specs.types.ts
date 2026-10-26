import type { Project } from '@/modules/project/entities'
import type { RunStatus } from '@/modules/run/entities'

/** What a mock project is in: the state of its last run, or no run yet. */
export type ExtraRunState = RunStatus | 'none'

export interface GeneratedProjectSpec {
  /** Numbers the ids of the project, its thread and its runs; unique, from 5. */
  n: number
  name: string
  description: string
  language?: Project['output_language']
  archived?: boolean
  /** The state of the one run of the project. */
  lastRun: ExtraRunState
  /** What the user typed to start the first run. */
  message: string
  /** Three titles of the requirements of the project. */
  requirements: [string, string, string]
  /** The kinds and numbers of the items of the project, as the list shows them. */
  itemCounts: Record<string, number>
  /** When the project was last active, on the day it was created or later. */
  day: string
}
