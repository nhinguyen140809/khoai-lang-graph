import type { Run, RunDefaults } from '@/modules/run/entities'

import { findProject } from '../projects/projects.lookup'
import { IdPrefix, nextCreatedId } from '../shared/db'
import { buildRun, noUsage } from './fixtures/runs.fixtures'
import { resolveRunConfig, runsOfThread } from './lookup/runs.lookup'
import { createdRuns, runEdits } from './runs.store'

/** Sets fields of a run, over what it had before. */
export function changeRun(runId: string, change: Partial<Run>) {
  runEdits.set({ ...runEdits.get(), [runId]: { ...runEdits.get()[runId], ...change } })
}

/** What a run that starts now begins with. */
interface NewRun {
  threadId: string
  projectId: string
  status: Extract<Run['status'], 'queued' | 'running'>
  currentStage: string
  /** The run that this one retries. */
  retryOfRunId?: string
  stepCount: number
  startedAt: string
  /** The settings that the request gives for this run. */
  override?: RunDefaults
}

/** Starts a run in a thread: it takes the next number and resolves its settings now. */
export function addRun(fields: NewRun): Run {
  const run = buildRun({
    id: nextCreatedId(IdPrefix.Run, createdRuns),
    thread_id: fields.threadId,
    project_id: fields.projectId,
    number: runsOfThread(fields.threadId).length + 1,
    status: fields.status,
    current_stage: fields.currentStage,
    run_config: resolveRunConfig(findProject(fields.projectId), fields.override),
    retry_of_run_id: fields.retryOfRunId ?? null,
    usage: noUsage,
    step_count: fields.stepCount,
    last_event_id: 0,
    started_at: fields.startedAt,
    finished_at: null,
  })
  createdRuns.set([...createdRuns.get(), run])
  return run
}
