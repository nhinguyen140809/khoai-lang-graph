import type { Message } from '@/features/console'
import type { Project } from '@/features/projects'
import type { Run, RunStep, Thread } from '@/features/threads'

import { type ExtraProjectSpec, extraProjectSpecs } from './extra-project-specs.constants'
import { mockId, USER_ID } from './mock-ids.constants'
import { buildMockRun, scriptedSteps } from './runs.fixtures'

// Mock projects beyond the four of the API examples: each has a thread, runs in one of the states
// of a run, the messages that started them, a few items, and steps. They are generated from the
// specs, so that a spec is all it takes to add a project.

const projectId = (n: number) => mockId('90aa', n)
const threadId = (n: number) => mockId('7f3a', n)
const runId = (n: number, number: number) => mockId('5f2d', n * 10 + number)
const messageId = (n: number, number: number) => mockId('c2a1', n * 10 + number)

const at = (day: string, time: string) => `${day}T${time}Z`
const runStart = (spec: ExtraProjectSpec) => at(spec.day, '09:00:00')

/** The run of a project: it has one, in the state of `lastRun`, or none yet. */
function runsOf(spec: ExtraProjectSpec): Run[] {
  const status = spec.lastRun
  if (status === 'none') return []
  const finished = status === 'succeeded' || status === 'failed' || status === 'cancelled'
  const stage = {
    succeeded: 'done',
    running: 'interviewing',
    interrupted: 'persona_review',
    failed: 'analysis',
    cancelled: 'interviewing',
    queued: 'planning',
  }[status]
  return [
    buildMockRun({
      id: runId(spec.n, 1),
      thread_id: threadId(spec.n),
      project_id: projectId(spec.n),
      number: 1,
      status,
      current_stage: stage,
      error:
        status === 'failed'
          ? {
              code: 'provider_error',
              message: 'The model provider failed after the retries.',
              stage,
            }
          : null,
      step_count: {
        succeeded: 71,
        running: 6,
        interrupted: 3,
        failed: 20,
        cancelled: 9,
        queued: 0,
      }[status],
      started_at: runStart(spec),
      finished_at: finished ? at(spec.day, '09:40:00') : null,
    }),
  ]
}

export function extraRuns(): Run[] {
  return extraProjectSpecs.flatMap(runsOf)
}

/** The steps of one of the extra runs, or none when the run is not one of them. */
export function extraRunSteps(id: string): RunStep[] | undefined {
  for (const spec of extraProjectSpecs) {
    const found = runsOf(spec).find((candidate) => candidate.id === id)
    if (found !== undefined) return scriptedSteps(found, 100 + spec.n)
  }
  return undefined
}

export function extraProjects(): Project[] {
  return extraProjectSpecs.map((spec) => ({
    id: projectId(spec.n),
    owner_id: USER_ID,
    name: spec.name,
    description: spec.description,
    status: spec.archived === true ? 'archived' : 'active',
    output_language: spec.language ?? 'en',
    run_config: { review_checkpoints: null, max_steps: null, max_cost_usd: null, parameters: null },
    initial_message_id: spec.lastRun === 'none' ? null : messageId(spec.n, 1),
    model_overrides: {},
    item_counts: spec.itemCounts,
    unfinished_run_counts: { queued: 0, running: 0, interrupted: 0 },
    last_activity_at: at(spec.day, '11:00:00'),
    created_at: at(spec.day, '07:50:00'),
    updated_at: at(spec.day, '11:00:00'),
  }))
}

export function extraThreads(): Thread[] {
  return extraProjectSpecs.map((spec) => {
    const last = runsOf(spec).at(-1)
    const status = last?.status
    const unfinished = status === 'queued' || status === 'running' || status === 'interrupted'
    return {
      id: threadId(spec.n),
      project_id: projectId(spec.n),
      created_by: USER_ID,
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

/** The message that started the run of each project that has one. */
export function extraMessages(): Message[] {
  return extraProjectSpecs.flatMap((spec) =>
    spec.lastRun === 'none'
      ? []
      : [
          {
            id: messageId(spec.n, 1),
            thread_id: threadId(spec.n),
            sequence: 1,
            run_id: runId(spec.n, 1),
            author: 'user' as const,
            agent_role: null,
            content: spec.message,
            delivery: 'started_run' as const,
            delivered_in_step_id: null,
            created_at: runStart(spec),
          },
        ],
  )
}

/** The projects that `?mock-projects=many` adds: plain rows, for a long list. */
export function bulkProjects(count: number): Project[] {
  return Array.from({ length: count }, (_, index) => {
    const n = 100 + index
    const day = `2026-09-${String(1 + (index % 28)).padStart(2, '0')}`
    return {
      id: projectId(n),
      owner_id: USER_ID,
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
      last_activity_at: at(day, '10:00:00'),
      created_at: at(day, '08:00:00'),
      updated_at: at(day, '10:00:00'),
    }
  })
}
