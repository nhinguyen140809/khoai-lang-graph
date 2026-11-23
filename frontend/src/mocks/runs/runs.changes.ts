import type { Run, RunDefaults, StepNote } from '@/modules/run/entities'

import { findProject } from '../projects/projects.lookup'
import { IdPrefix, nextCreatedId } from '../shared/db'
import {
  assistanceAgentFixture as agent,
  assistanceDefinitionFixture as assistance,
} from '../workflow/workflow.fixtures'
import { buildRun, buildStep, noUsage } from './fixtures/runs.fixtures'
import { resolveRunConfig, runsOfThread } from './lookup/runs.lookup'
import { createdRuns, createdSteps, runEdits } from './runs.store'

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
  /** The models by agent role that the request gives for this run, over the resolved ones. */
  models?: Record<string, string>
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
    run_config: resolveRunConfig(findProject(fields.projectId), fields.override, fields.models),
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

/**
 * The run of the assistance workflow that answers a message, while it works: one step of its agent,
 * with no note yet. It is a run of the thread, in its order, and not the work of the project.
 */
export function startAnsweringRun(fields: {
  threadId: string
  projectId: string
  now: string
}): Run {
  const run = buildRun({
    id: nextCreatedId(IdPrefix.Run, createdRuns),
    thread_id: fields.threadId,
    project_id: fields.projectId,
    number: runsOfThread(fields.threadId).length + 1,
    workflow_name: assistance.name,
    workflow_version: assistance.version,
    status: 'running',
    current_stage: agent.stage,
    run_config: resolveRunConfig(findProject(fields.projectId)),
    usage: noUsage,
    step_count: 1,
    last_event_id: 0,
    started_at: fields.now,
    finished_at: null,
  })
  createdRuns.set([...createdRuns.get(), run])
  createdSteps.set([
    ...createdSteps.get(),
    buildStep({
      sequence: 1,
      id: `${run.id}-step-1`,
      run_id: run.id,
      node: agent.id,
      agent_role: agent.agent_role,
      stage: agent.stage,
      status: 'running',
      started_at: fields.now,
    }),
  ])
  return run
}

/** Ends the run that answers a message: its step holds a note for each read that was made. */
export function endAnsweringRun(runId: string, fields: { notes: StepNote[]; now: string }) {
  changeRun(runId, { status: 'succeeded', finished_at: fields.now })
  createdSteps.set(
    createdSteps.get().map((step) =>
      step.run_id === runId
        ? {
            ...step,
            status: 'succeeded',
            llm_calls: fields.notes.length + 1,
            notes: fields.notes,
            finished_at: fields.now,
          }
        : step,
    ),
  )
}
