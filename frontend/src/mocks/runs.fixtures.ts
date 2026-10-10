import type { Run, RunStep } from '@/features/threads'

import {
  PERSONA_IDS,
  PROJECT_IDS,
  RUN_IDS,
  stepId,
  THREAD_IDS,
  USER_ID,
} from './mock-ids.constants'
import { mockParallelRuns, type MockRunState } from './mock-scenario.utils'

// Mock runs and run steps. The third run of the main thread of the mentor platform is the run of
// the API examples: it retries the second run from its planner step and waits at the analysis
// review. Its state follows the `mock-run-state` scenario.

const SONNET = 'anthropic:claude-sonnet-5'
const MINI = 'openai:gpt-4.1-mini'

const runConfig: Run['run_config'] = {
  models: {
    intent_router: MINI,
    planner: SONNET,
    persona_generator: SONNET,
    interviewer: MINI,
    persona_agent: MINI,
    analyst: SONNET,
    requirement_engineer: SONNET,
    backlog_manager: SONNET,
    validator: SONNET,
  },
  review_checkpoints: ['checkpoint_personas', 'checkpoint_analysis', 'checkpoint_spec'],
  output_language: 'en',
  max_steps: 80,
  max_cost_usd: 2.0,
  parameters: { target_personas_num: 3, max_personas: 3, max_turns: 12, max_iterations: 2 },
}

const noUsage: Run['usage'] = {
  input_tokens: 0,
  output_tokens: 0,
  cache_read_tokens: 0,
  cache_write_tokens: 0,
  cost_usd: 0,
  duration_ms: 0,
}

function usage(costUsd: number, durationMs: number, inputTokens: number): Run['usage'] {
  return {
    input_tokens: inputTokens,
    output_tokens: Math.round(inputTokens / 5),
    cache_read_tokens: Math.round(inputTokens * 0.6),
    cache_write_tokens: 0,
    cost_usd: costUsd,
    duration_ms: durationMs,
  }
}

function run(fields: Partial<Run> & Pick<Run, 'id' | 'thread_id' | 'project_id' | 'number'>): Run {
  return {
    started_by: USER_ID,
    workflow_name: 'requirements_engineering',
    workflow_version: 1,
    status: 'succeeded',
    current_stage: 'done',
    iteration_count: 0,
    run_config: runConfig,
    retry_of_run_id: null,
    error: null,
    usage: usage(0.61, 412_000, 52_000),
    trace_id: null,
    step_count: 71,
    last_event_id: 268,
    started_at: '2026-10-01T09:00:00Z',
    finished_at: '2026-10-01T09:12:00Z',
    ...fields,
  }
}

const finishedRuns: Run[] = [
  run({
    id: RUN_IDS.mentorMain1,
    thread_id: THREAD_IDS.mentorMain,
    project_id: PROJECT_IDS.mentor,
    number: 1,
    started_at: '2026-10-02T08:10:01Z',
    finished_at: '2026-10-02T08:52:40Z',
  }),
  run({
    id: RUN_IDS.mentorMain2,
    thread_id: THREAD_IDS.mentorMain,
    project_id: PROJECT_IDS.mentor,
    number: 2,
    step_count: 70,
    last_event_id: 262,
    status: 'failed',
    current_stage: 'specification',
    error: {
      code: 'cost_limit_exceeded',
      message: 'The next model call would exceed the cost limit of the run.',
      stage: 'specification',
    },
    usage: usage(1.98, 380_000, 140_000),
    started_at: '2026-10-04T10:00:00Z',
    finished_at: '2026-10-04T10:21:15Z',
  }),
  run({
    id: RUN_IDS.mentorBooking1,
    number: 1,
    thread_id: THREAD_IDS.mentorBooking,
    project_id: PROJECT_IDS.mentor,
    started_at: '2026-10-04T13:40:00Z',
    finished_at: '2026-10-04T14:05:00Z',
  }),
  run({
    id: RUN_IDS.campusMain1,
    number: 1,
    thread_id: THREAD_IDS.campusMain,
    project_id: PROJECT_IDS.campus,
    started_at: '2026-10-05T15:50:00Z',
    finished_at: '2026-10-05T16:20:00Z',
  }),
  run({
    id: RUN_IDS.libraryMain1,
    number: 1,
    step_count: 4,
    thread_id: THREAD_IDS.libraryMain,
    project_id: PROJECT_IDS.library,
    status: 'running',
    current_stage: 'interviewing',
    usage: usage(0.06, 125_000, 6_400),
    last_event_id: 16,
    started_at: '2026-10-03T10:10:00Z',
    finished_at: null,
  }),
  run({
    id: RUN_IDS.laundryMain1,
    number: 1,
    thread_id: THREAD_IDS.laundryMain,
    project_id: PROJECT_IDS.laundry,
    started_at: '2026-09-20T08:40:00Z',
    finished_at: '2026-09-20T09:00:00Z',
  }),
]

const mentorRun3Statuses = {
  running: { status: 'running', current_stage: 'analysis' },
  waiting: { status: 'interrupted', current_stage: 'analysis_review' },
  failed: { status: 'failed', current_stage: 'analysis' },
  done: { status: 'succeeded', current_stage: 'done' },
} as const satisfies Record<MockRunState, Pick<Run, 'status' | 'current_stage'>>

// The last event of the run of the API examples: 246 while it waits, as in the examples.
const mentorRun3LastEventIds = {
  running: 241,
  waiting: 246,
  failed: 243,
  done: 290,
} as const satisfies Record<MockRunState, number>

/** The run of the API examples, in the given state. */
export function mentorRun3(state: MockRunState): Run {
  const steps = mentorRun3Steps(state)
  const last = steps.at(-1)
  return run({
    id: RUN_IDS.mentorMain3,
    thread_id: THREAD_IDS.mentorMain,
    project_id: PROJECT_IDS.mentor,
    number: 3,
    ...mentorRun3Statuses[state],
    retry_of_run_id: RUN_IDS.mentorMain2,
    error:
      state === 'failed'
        ? {
            code: 'provider_error',
            message: 'The model provider failed, after the retries and the fallback models.',
            stage: 'analysis',
          }
        : null,
    usage: {
      input_tokens: 48210,
      output_tokens: 9930,
      cache_read_tokens: 31500,
      cache_write_tokens: 6200,
      cost_usd: state === 'done' ? 0.71 : 0.42,
      duration_ms: 214000,
    },
    trace_id: 'b81c0000-0000-4000-8000-000000000001',
    step_count: steps.length,
    last_event_id: mentorRun3LastEventIds[state],
    started_at: '2026-10-06T08:30:01Z',
    finished_at: state === 'failed' || state === 'done' ? (last?.finished_at ?? null) : null,
  })
}

interface StepSpec {
  node: string
  agentRole: string | null
  stage: string
  seconds: number
  costUsd?: number
  subject?: string
  produced?: RunStep['produced']
}

function buildSteps(
  runId: string,
  runIndex: number,
  startedAt: string,
  specs: StepSpec[],
): RunStep[] {
  let clock = Date.parse(startedAt)
  return specs.map((spec, index) => {
    const start = clock
    clock += spec.seconds * 1000
    const costUsd = spec.costUsd ?? 0
    return {
      id: stepId(runIndex, index + 1),
      run_id: runId,
      sequence: index + 1,
      node: spec.node,
      agent_role: spec.agentRole,
      stage: spec.stage,
      status: 'succeeded',
      iteration: 0,
      subject_item_id: spec.subject ?? null,
      model_id: spec.agentRole === null ? null : (runConfig.models[spec.agentRole] ?? null),
      llm_calls: spec.agentRole === null ? 0 : 1,
      usage:
        spec.agentRole === null
          ? { ...noUsage, duration_ms: spec.seconds * 1000 }
          : usage(costUsd, spec.seconds * 1000, Math.round(costUsd * 120_000)),
      produced: spec.produced ?? [],
      error: null,
      started_at: new Date(start).toISOString().replace('.000Z', 'Z'),
      finished_at: new Date(clock).toISOString().replace('.000Z', 'Z'),
    }
  })
}

function interviewSpecs(personaIndex: number, turns: number): StepSpec[] {
  const personaKey = `PER-00${String(personaIndex + 1)}`
  const subject = PERSONA_IDS[personaIndex]
  return Array.from({ length: turns * 2 }, (_, index) => {
    const asking = index % 2 === 0
    return {
      node: asking ? 'interviewer' : 'persona_agent',
      agentRole: asking ? 'interviewer' : 'persona_agent',
      stage: 'interviewing',
      seconds: 8,
      costUsd: 0.004,
      ...(subject !== undefined && { subject }),
      produced: [
        {
          item_id: `9d01${String(personaIndex)}${String(index).padStart(3, '0')}-0000-4000-8000-000000000001`,
          kind: 'interview_message',
          key: `${personaKey}#${String(index + 1)}`,
          version: 1,
        },
      ],
    }
  })
}

const personas = ['PER-001', 'PER-002', 'PER-003'].map((key, index) => ({
  item_id: PERSONA_IDS[index] ?? key,
  kind: 'persona',
  key,
  version: 1,
}))

const mentorRun3Specs: StepSpec[] = [
  { node: 'planner', agentRole: 'planner', stage: 'planning', seconds: 9, costUsd: 0.015 },
  {
    node: 'persona_generator',
    agentRole: 'persona_generator',
    stage: 'persona_generation',
    seconds: 18,
    costUsd: 0.03,
    produced: personas,
  },
  { node: 'checkpoint_personas', agentRole: null, stage: 'persona_review', seconds: 95 },
  ...interviewSpecs(0, 12),
  ...interviewSpecs(1, 9),
  ...interviewSpecs(2, 10),
  { node: 'analyst', agentRole: 'analyst', stage: 'analysis', seconds: 53, costUsd: 0.065 },
  { node: 'checkpoint_analysis', agentRole: null, stage: 'analysis_review', seconds: 140 },
  {
    node: 'requirement_engineer',
    agentRole: 'requirement_engineer',
    stage: 'specification',
    seconds: 64,
    costUsd: 0.12,
  },
  { node: 'checkpoint_spec', agentRole: null, stage: 'specification_review', seconds: 210 },
  {
    node: 'backlog_manager',
    agentRole: 'backlog_manager',
    stage: 'backlog',
    seconds: 41,
    costUsd: 0.09,
  },
  { node: 'validator', agentRole: 'validator', stage: 'validation', seconds: 37, costUsd: 0.08 },
]

// The sequence of the analyst step and of the analysis checkpoint.
const ANALYST_STEP = 66
const ANALYSIS_CHECKPOINT_STEP = 67

/** The steps of the run of the API examples, in the given state. */
export function mentorRun3Steps(state: MockRunState): RunStep[] {
  const all = buildSteps(RUN_IDS.mentorMain3, 3, '2026-10-06T08:30:01Z', mentorRun3Specs)
  switch (state) {
    case 'done':
      return all
    case 'waiting':
      return all
        .slice(0, ANALYSIS_CHECKPOINT_STEP)
        .map((step) =>
          step.sequence === ANALYSIS_CHECKPOINT_STEP
            ? { ...step, status: 'running', finished_at: null }
            : step,
        )
    case 'running':
      return all
        .slice(0, ANALYST_STEP)
        .map((step) =>
          step.sequence === ANALYST_STEP ? { ...step, status: 'running', finished_at: null } : step,
        )
    case 'failed':
      return all.slice(0, ANALYST_STEP).map((step) =>
        step.sequence === ANALYST_STEP
          ? {
              ...step,
              status: 'failed',
              error: 'The model provider failed, after the retries and the fallback models.',
            }
          : step,
      )
  }
}

const libraryRunSteps = buildSteps(RUN_IDS.libraryMain1, 6, '2026-10-03T10:10:00Z', [
  { node: 'planner', agentRole: 'planner', stage: 'planning', seconds: 11, costUsd: 0.016 },
  {
    node: 'persona_generator',
    agentRole: 'persona_generator',
    stage: 'persona_generation',
    seconds: 15,
    costUsd: 0.028,
  },
  { node: 'checkpoint_personas', agentRole: null, stage: 'persona_review', seconds: 60 },
  {
    node: 'interviewer',
    agentRole: 'interviewer',
    stage: 'interviewing',
    seconds: 4,
    costUsd: 0.004,
  },
]).map((step) =>
  step.sequence === 4 ? { ...step, status: 'running' as const, finished_at: null } : step,
)

/** Every run of the mock data, with the run of the API examples in the given state. */
export function mockRuns(state: MockRunState): Run[] {
  if (!mockParallelRuns()) return [...finishedRuns, mentorRun3(state)]
  // Two more runs of the mentor platform that are unfinished.
  const runs = finishedRuns.map((item) =>
    item.id === RUN_IDS.mentorBooking1
      ? {
          ...item,
          status: 'running' as const,
          current_stage: 'interviewing',
          step_count: 5,
          usage: usage(0.11, 90_000, 9_000),
          finished_at: null,
        }
      : item,
  )
  return [
    ...runs,
    run({
      id: RUN_IDS.mentorExport1,
      number: 1,
      thread_id: THREAD_IDS.mentorExport,
      project_id: PROJECT_IDS.mentor,
      status: 'queued',
      current_stage: 'planning',
      step_count: 0,
      usage: noUsage,
      last_event_id: 0,
      started_at: null,
      finished_at: null,
    }),
    mentorRun3(state),
  ]
}

/** The steps of a run. Runs other than the run of the API examples and the running run have none. */
export function mockRunSteps(runId: string, state: MockRunState): RunStep[] {
  if (runId === RUN_IDS.mentorMain3) return mentorRun3Steps(state)
  if (runId === RUN_IDS.libraryMain1) return libraryRunSteps
  return []
}
