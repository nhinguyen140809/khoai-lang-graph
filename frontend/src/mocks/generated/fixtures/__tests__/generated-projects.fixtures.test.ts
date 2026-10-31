import { describe, expect, it } from 'vitest'

import { manyProjectCount } from '../../generated.constants'
import { generatedProjectSpecs } from '../generated-project-specs.fixtures'
import {
  generatedMessages,
  generatedProjects,
  generatedRuns,
  generatedRunSteps,
  generatedThreads,
  manyProjects,
} from '../generated-projects.fixtures'
import { lastStepCases, recordIdCases } from './generated-projects.fixtures.data'

function hasUniqueIds(ids: string[]) {
  return new Set(ids).size === ids.length
}

describe('the extra projects of the mock data', () => {
  it.each(recordIdCases)('give the $records ids apart from those of the fixtures', ({ ids }) => {
    expect(hasUniqueIds(ids)).toBe(true)
  })

  it('have a thread each, and one run at most', () => {
    const threads = generatedThreads()
    const runs = generatedRuns()

    expect(generatedProjects()).toHaveLength(generatedProjectSpecs.length)
    expect(threads).toHaveLength(generatedProjectSpecs.length)
    for (const run of runs) {
      expect(threads.some((thread) => thread.id === run.thread_id)).toBe(true)
    }
    expect(hasUniqueIds(runs.map(({ thread_id }) => thread_id))).toBe(true)
  })

  it('gives one message to each project with a run, whose id is its initial message', () => {
    const messages = generatedMessages()
    const withRun = generatedProjects().filter(
      ({ initial_message_id }) => initial_message_id !== null,
    )

    expect(messages.map(({ id }) => id)).toEqual(
      withRun.map(({ initial_message_id }) => initial_message_id),
    )
  })

  it('cover every state of a run, and a project without a run', () => {
    const statuses = new Set(generatedRuns().map(({ status }) => status))

    expect(statuses).toEqual(
      new Set(['succeeded', 'running', 'interrupted', 'failed', 'cancelled']),
    )
    expect(generatedProjectSpecs.some(({ lastRun }) => lastRun === 'none')).toBe(true)
  })

  it.each(lastStepCases)(
    'end the steps of a $runStatus run at its stage, with a $stepStatus step',
    ({ runStatus, stepStatus }) => {
      const run = generatedRuns().find(({ status }) => status === runStatus)

      expect(generatedRunSteps(run?.id ?? '')?.at(-1)).toMatchObject({
        stage: run?.current_stage,
        status: stepStatus,
      })
    },
  )

  it('have no steps for a run that is not one of them', () => {
    expect(generatedRunSteps('no-such-run')).toBeUndefined()
  })
})

describe('manyProjects', () => {
  it('makes as many projects as asked, with different ids, some archived', () => {
    const projects = manyProjects(manyProjectCount)

    expect(projects).toHaveLength(manyProjectCount)
    expect(hasUniqueIds(projects.map(({ id }) => id))).toBe(true)
    expect(projects.some(({ status }) => status === 'archived')).toBe(true)
  })
})
