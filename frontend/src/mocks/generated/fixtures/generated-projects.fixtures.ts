import type { Project } from '@/modules/project/entities'
import type { Run, RunStep } from '@/modules/run/entities'
import { isUnfinishedRunStatus } from '@/modules/run/entities'
import type { Thread } from '@/modules/thread/entities'

import { buildMockRun, scriptedSteps } from '../../runs/runs.fixtures'
import { IdPrefix, userId } from '../../shared/db/mock-ids.constants'
import { mockId } from '../../shared/db/mock-ids.utils'
import type { ExtraProjectSpec } from '../generated-project-specs.types'
import { extraProjectSpecs } from './generated-project-specs.fixtures'

// Mock projects beyond the four of `projects.fixtures.ts`: each has a thread, a run in one of the
// states of a run, and its steps. They are generated from the specs, so that a spec is all it takes to add
// a project.

const projectId = (n: number) => mockId(IdPrefix.Project, n)
const threadId = (n: number) => mockId(IdPrefix.Thread, n)
const runId = (n: number, number: number) => mockId(IdPrefix.Run, n * 10 + number)
const messageId = (n: number, number: number) => mockId(IdPrefix.Message, n * 10 + number)

const at = (day: string, time: string) => `${day}T${time}Z`
const runStart = (spec: ExtraProjectSpec) => at(spec.day, '09:00:00')
// Numbers the ids of the steps of the run of a project.
const stepRunIndex = (spec: ExtraProjectSpec) => 100 + spec.n

/** The run of a project: it has one, in the state of `lastRun`, or none yet. */
function runsOf(spec: ExtraProjectSpec): Run[] {
  const status = spec.lastRun
  if (status === 'none') return []
  const finished = !isUnfinishedRunStatus(status)
  const stage = {
    succeeded: 'done',
    running: 'interviewing',
    interrupted: 'persona_review',
    failed: 'analysis',
    cancelled: 'interviewing',
    queued: 'planning',
  }[status]
  const run = buildMockRun({
    id: runId(spec.n, 1),
    thread_id: threadId(spec.n),
    project_id: projectId(spec.n),
    number: 1,
    status,
    current_stage: stage,
    error:
      status === 'failed'
        ? { code: 'provider_error', message: 'The model provider failed after the retries.', stage }
        : null,
    started_at: runStart(spec),
    finished_at: finished ? at(spec.day, '09:40:00') : null,
  })
  return [{ ...run, step_count: scriptedSteps(run, stepRunIndex(spec)).length }]
}

export function extraRuns(): Run[] {
  return extraProjectSpecs.flatMap(runsOf)
}

/** The steps of one of the extra runs, or none when the run is not one of them. */
export function extraRunSteps(id: string): RunStep[] | undefined {
  for (const spec of extraProjectSpecs) {
    const found = runsOf(spec).find((candidate) => candidate.id === id)
    if (found !== undefined) return scriptedSteps(found, stepRunIndex(spec))
  }
  return undefined
}

export function extraProjects(): Project[] {
  return extraProjectSpecs.map((spec) => ({
    id: projectId(spec.n),
    owner_id: userId,
    name: spec.name,
    description: spec.description,
    status: spec.archived === true ? 'archived' : 'active',
    output_language: spec.language ?? 'en',
    run_config: { review_checkpoints: null, max_steps: null, max_cost_usd: null, parameters: null },
    initial_message_id: spec.lastRun === 'none' ? null : messageId(spec.n, 1),
    model_overrides: {},
    item_counts: spec.itemCounts,
    unfinished_run_counts: { queued: 0, running: 0, interrupted: 0 },
    rollup_run_status: null,
    last_activity_at: at(spec.day, '11:00:00'),
    created_at: at(spec.day, '07:50:00'),
    updated_at: at(spec.day, '11:00:00'),
  }))
}

export function extraThreads(): Thread[] {
  return extraProjectSpecs.map((spec) => {
    const last = runsOf(spec).at(-1)
    const status = last?.status
    const unfinished = status !== undefined && isUnfinishedRunStatus(status)
    return {
      id: threadId(spec.n),
      project_id: projectId(spec.n),
      created_by: userId,
      title: 'Main thread',
      status: 'active',
      current_stage: last?.current_stage ?? null,
      active_run_id: unfinished ? (last?.id ?? null) : null,
      active_run_status: unfinished ? status : null,
      last_message_at: at(spec.day, '09:00:00'),
      created_at: at(spec.day, '07:55:00'),
      updated_at: at(spec.day, '11:00:00'),
    }
  })
}

/** The projects that `?mock-projects=many` adds: plain rows, for a long list. */
export function bulkProjects(count: number): Project[] {
  return Array.from({ length: count }, (_, index) => {
    const n = 100 + index
    const day = `2026-09-${String(1 + (index % 28)).padStart(2, '0')}`
    return {
      id: projectId(n),
      owner_id: userId,
      name: `Sample project ${String(index + 1).padStart(3, '0')}`,
      description: `One of the ${String(count)} projects that make the list long.`,
      status: index % 9 === 8 ? ('archived' as const) : ('active' as const),
      output_language: index % 5 === 4 ? ('vi' as const) : ('en' as const),
      run_config: {
        review_checkpoints: null,
        max_steps: null,
        max_cost_usd: null,
        parameters: null,
      },
      initial_message_id: null,
      model_overrides: {},
      item_counts: { persona: 2 + (index % 3), spec_requirement: index % 20 },
      unfinished_run_counts: { queued: 0, running: 0, interrupted: 0 },
      rollup_run_status: null,
      last_activity_at: at(day, '10:00:00'),
      created_at: at(day, '08:00:00'),
      updated_at: at(day, '10:00:00'),
    }
  })
}
