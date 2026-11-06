import { describe, expect, it } from 'vitest'

import { buildStep } from '@/mocks/runs/fixtures/runs.fixtures'
import { assertPresent } from '@/shared/lib/guards'

import { stageProgress } from '../stage-progress.utils'
import {
  interviewSteps,
  runWith,
  stage,
  subject,
  viewOf,
  visibleStages,
} from './stage-progress.utils.data'

/** The steps of a run that went through the stages given, one step in each. */
function stepsOfStages(...stages: string[]) {
  return stages.map((name, index) =>
    buildStep({
      sequence: index + 1,
      agent_role: 'analyst',
      stage: name,
      started_at: `2026-10-06T08:${String(30 + index)}:00Z`,
      finished_at: `2026-10-06T08:${String(31 + index)}:00Z`,
    }),
  )
}

describe('stageProgress', () => {
  it('gives every stage not started without a run', () => {
    const stages = stageProgress(visibleStages, { steps: [], run: null, subjects: new Map() })

    expect(stages.map(viewOf)).toEqual(
      visibleStages.map(({ key }, index) => ({
        key,
        status: 'not_started',
        number: index + 1,
        isOpen: false,
      })),
    )
  })

  it.each([
    {
      name: 'a running run',
      run: runWith('running', 'analysis'),
      status: 'running',
    },
    {
      name: 'a run that waits at a review',
      run: runWith('interrupted', 'analysis_review'),
      status: 'waiting',
    },
    {
      name: 'a failed run',
      run: runWith('failed', 'analysis'),
      status: 'failed',
    },
    {
      name: 'a stopped run',
      run: runWith('cancelled', 'analysis'),
      status: 'stopped',
    },
    {
      name: 'a finished run',
      run: runWith('succeeded', 'analysis'),
      status: 'done',
    },
  ])('gives the current stage the status of the run: $name', ({ run, status }) => {
    const stages = stageProgress(visibleStages, {
      steps: stepsOfStages('planning', 'analysis'),
      run,
      subjects: new Map(),
    })

    const current = stages.find(({ key }) => key === run.current_stage)
    expect(viewOf(assertPresent(current, 'the current stage')).status).toBe(status)
    expect(current?.isOpen).toBe(true)
    expect(stages[3]?.isOpen).toBe(false)
  })

  it('marks the stages before the current one done, the ones after not started', () => {
    const stages = stageProgress(visibleStages, {
      steps: stepsOfStages('planning', 'interviewing'),
      run: runWith('running', 'interviewing'),
      subjects: new Map(),
    })

    expect(stages.map(({ status }) => status)).toEqual([
      'done',
      'not_started',
      'not_started',
      'running',
      'not_started',
      'not_started',
    ])
  })

  it('gives way to the stage of the latest visible step when the run names one the user does not see', () => {
    const stages = stageProgress(visibleStages, {
      steps: stepsOfStages('planning', 'interviewing'),
      run: runWith('running', 'intent_routing'),
      subjects: new Map(),
    })

    expect(stages[3]?.status).toBe('running')
    expect(stages[3]?.isOpen).toBe(true)
  })

  it('takes the status of the child that needs the user most when a stage nests stages', () => {
    const nested = [
      stage('analysis', 'Analysing the interviews', [
        stage('grouping', 'Grouping the needs'),
        stage('disagreements', 'Finding the disagreements'),
      ]),
    ]
    const stages = stageProgress(nested, {
      steps: [
        buildStep({ sequence: 1, agent_role: 'analyst', stage: 'grouping' }),
        buildStep({
          sequence: 2,
          agent_role: 'analyst',
          stage: 'disagreements',
          status: 'running',
          finished_at: null,
        }),
      ],
      run: runWith('running', 'disagreements'),
      subjects: new Map(),
    })

    expect(stages.map(viewOf)).toEqual([
      {
        key: 'analysis',
        status: 'running',
        number: 1,
        isOpen: true,
        children: [
          { key: 'grouping', status: 'done', number: 1, isOpen: false },
          { key: 'disagreements', status: 'running', number: 2, isOpen: true },
        ],
      },
    ])
  })

  it('lists the subjects of a stage that runs once for each, in the order the run takes them', () => {
    const subjects = new Map([['interviewing', [subject(1), subject(2), subject(3)]]])
    const stages = stageProgress(visibleStages, {
      steps: [...stepsOfStages('planning'), ...interviewSteps(2, 2), ...interviewSteps(1, 4)],
      run: runWith('running', 'interviewing'),
      subjects,
    })

    expect(viewOf(assertPresent(stages[3], 'interviewing')).subjects).toEqual([
      { key: 'PER-002', status: 'done', number: 1 },
      { key: 'PER-001', status: 'done', number: 2 },
      { key: 'PER-003', status: 'not_started', number: 3 },
    ])
  })

  it('marks the subject in progress, and keeps a failed subject failed', () => {
    const subjects = new Map([['interviewing', [subject(1), subject(2)]]])
    const stages = stageProgress(visibleStages, {
      steps: [...interviewSteps(1, 1), ...interviewSteps(2, 3, true)],
      run: runWith('running', 'interviewing'),
      subjects,
    })

    expect(viewOf(assertPresent(stages[3], 'interviewing')).subjects).toEqual([
      { key: 'PER-001', status: 'done', number: 1 },
      { key: 'PER-002', status: 'running', number: 2 },
    ])
  })

  it('numbers the stages of each level from 1', () => {
    const stages = stageProgress(visibleStages, { steps: [], run: null, subjects: new Map() })

    expect(stages.map(({ number }) => number)).toEqual([1, 2, 3, 4, 5, 6])
  })
})
