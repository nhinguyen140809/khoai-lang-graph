import { buildStep } from '@/mocks/runs/fixtures/runs.fixtures'

import type { RunStep } from '../../steps/run-steps.types'
import type { WorkStatus } from '../work.types'

export interface WorkEntryCase {
  name: string
  steps: (Partial<RunStep> & Pick<RunStep, 'sequence'>)[]
  runStatus: 'running' | 'interrupted' | 'succeeded' | 'failed' | 'cancelled' | null
  /** The state of each line: its id (the sequence of its first step), status and parts of it. */
  lines: {
    status: WorkStatus
    iteration?: number
    durationMs?: number | null
    costUsd?: number
    modelId?: string | null
    error?: string | null
    subjectKey?: string | null
    created?: string[]
    changed?: string[]
  }[]
}

/** The lines the work of a run makes, from steps built on the cases' fields. */
export const workEntryCases: WorkEntryCase[] = [
  {
    name: 'one step of an agent',
    steps: [
      {
        sequence: 1,
        agent_role: 'analyst',
        stage: 'analysis',
        model_id: 'openai:gpt-4.1-mini',
        started_at: '2026-10-06T08:30:00Z',
        finished_at: '2026-10-06T08:31:00Z',
      },
    ],
    runStatus: 'succeeded',
    lines: [{ status: 'done', durationMs: 60_000, modelId: 'openai:gpt-4.1-mini' }],
  },
  {
    name: 'steps on one subject joined, with what they produced',
    steps: [
      {
        sequence: 1,
        agent_role: 'interviewer',
        stage: 'interviewing',
        subject_item_id: 'p1',
        started_at: '2026-10-06T08:32:00Z',
        finished_at: '2026-10-06T08:33:00Z',
        produced: [
          { item_id: 'p1', kind: 'interview_message', key: 'PER-001#1', version: 1 },
          { item_id: 'i2', kind: 'interview_message', key: 'PER-001#2', version: 1 },
        ],
      },
      {
        sequence: 2,
        agent_role: 'persona_agent',
        stage: 'interviewing',
        subject_item_id: 'p1',
        started_at: '2026-10-06T08:33:00Z',
        finished_at: '2026-10-06T08:34:00Z',
        produced: [
          { item_id: 'i3', kind: 'interview_message', key: 'PER-001#3', version: 1 },
          { item_id: 'p1', kind: 'interview_message', key: 'PER-001#1', version: 2 },
        ],
      },
    ],
    runStatus: 'succeeded',
    lines: [
      {
        status: 'done',
        durationMs: 120_000,
        subjectKey: 'PER-001',
        created: ['PER-001#1', 'PER-001#2', 'PER-001#3'],
        changed: [],
      },
    ],
  },
  {
    name: 'a checkpoint step is left out',
    steps: [
      { sequence: 1, agent_role: null, stage: 'persona_review', node: 'checkpoint_personas' },
      { sequence: 2, agent_role: 'analyst', stage: 'analysis' },
    ],
    runStatus: 'interrupted',
    lines: [{ status: 'done' }],
  },
  {
    name: 'a step that runs while the run works',
    steps: [
      {
        sequence: 1,
        agent_role: 'analyst',
        stage: 'analysis',
        status: 'running',
        finished_at: null,
      },
    ],
    runStatus: 'running',
    lines: [{ status: 'running', durationMs: null }],
  },
  {
    name: 'a step that runs while the run waits at a review',
    steps: [
      {
        sequence: 1,
        agent_role: 'analyst',
        stage: 'analysis',
        status: 'running',
        finished_at: null,
      },
    ],
    runStatus: 'interrupted',
    lines: [{ status: 'waiting', durationMs: null }],
  },
  {
    name: 'a step that failed, with its error and its cost',
    steps: [
      {
        sequence: 1,
        agent_role: 'analyst',
        stage: 'analysis',
        status: 'failed',
        error: 'The model provider failed, after the retries.',
        started_at: '2026-10-06T08:30:00Z',
        finished_at: '2026-10-06T08:31:00Z',
        usage: { ...buildStep({ sequence: 1 }).usage, cost_usd: 0.05 },
      },
    ],
    runStatus: 'failed',
    lines: [
      { status: 'failed', error: 'The model provider failed, after the retries.', costUsd: 0.05 },
    ],
  },
  {
    name: 'an item that only new versions were produced of reads as changed',
    steps: [
      {
        sequence: 1,
        agent_role: 'analyst',
        stage: 'analysis',
        started_at: '2026-10-06T08:30:00Z',
        finished_at: '2026-10-06T08:31:00Z',
        produced: [
          { item_id: 'i9', kind: 'analyzed_requirement', key: 'AR-004', version: 2 },
          { item_id: 'i9', kind: 'analyzed_requirement', key: 'AR-004', version: 3 },
        ],
      },
    ],
    runStatus: 'succeeded',
    lines: [{ status: 'done', created: [], changed: ['AR-004'] }],
  },
  {
    name: 'a step that ran while the run was stopped',
    steps: [
      {
        sequence: 1,
        agent_role: 'interviewer',
        stage: 'interviewing',
        subject_item_id: 'p1',
        status: 'running',
        finished_at: null,
      },
    ],
    runStatus: 'cancelled',
    lines: [{ status: 'stopped', durationMs: null }],
  },
  {
    name: 'a rework round of a subject',
    steps: [
      {
        sequence: 1,
        agent_role: 'interviewer',
        stage: 'interviewing',
        subject_item_id: 'p1',
        iteration: 1,
        started_at: '2026-10-06T08:32:00Z',
        finished_at: '2026-10-06T08:33:00Z',
      },
    ],
    runStatus: 'succeeded',
    lines: [{ status: 'done', iteration: 1, subjectKey: null }],
  },
]
