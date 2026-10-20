import type { RunStatus } from '../../types/run-status.types'

/** A run status, and whether the status of a project names the stage of the run. */
export const showsStageCases: { status: RunStatus; shows: boolean }[] = [
  { status: 'queued', shows: false },
  { status: 'running', shows: true },
  { status: 'interrupted', shows: true },
  { status: 'succeeded', shows: false },
  { status: 'failed', shows: true },
  { status: 'cancelled', shows: true },
]
