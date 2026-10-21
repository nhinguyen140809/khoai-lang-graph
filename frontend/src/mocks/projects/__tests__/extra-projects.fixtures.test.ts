import { describe, expect, it } from 'vitest'

import { isUnfinishedRunStatus } from '@/modules/run/entities'

import { extraProjectSpecs } from '../extra-project-specs.fixtures'
import {
  bulkProjects,
  extraProjects,
  extraRuns,
  extraRunSteps,
  extraThreads,
} from '../extra-projects.fixtures'
import { bulkProjectCount } from '../projects.constants'
import { extraProjectCases, lastStepCases, recordIdCases } from './extra-projects.fixtures.data'

function unique(ids: string[]) {
  return new Set(ids).size === ids.length
}

describe('the extra projects of the mock data', () => {
  it.each(recordIdCases)('give the $records ids apart from those of the fixtures', ({ ids }) => {
    expect(unique(ids)).toBe(true)
  })

  it('have a thread each, and one run at most', () => {
    const threads = extraThreads()
    const runs = extraRuns()

    expect(extraProjects()).toHaveLength(extraProjectSpecs.length)
    expect(threads).toHaveLength(extraProjectSpecs.length)
    for (const run of runs) {
      expect(threads.some((thread) => thread.id === run.thread_id)).toBe(true)
    }
    expect(unique(runs.map(({ thread_id }) => thread_id))).toBe(true)
  })

  it.each(extraProjectCases)(
    'show the unfinished run of $name on its thread, and none once its run ended',
    ({ projectId }) => {
      const thread = extraThreads().find((candidate) => candidate.project_id === projectId)
      const last = extraRuns()
        .filter((run) => run.project_id === projectId)
        .toSorted((a, b) => b.number - a.number)[0]
      const unfinished = last !== undefined && isUnfinishedRunStatus(last.status)

      expect(thread?.active_run_id).toBe(unfinished ? last.id : null)
    },
  )

  it('cover every state of a run, and a project without a run', () => {
    const statuses = new Set(extraRuns().map(({ status }) => status))

    expect(statuses).toEqual(
      new Set(['succeeded', 'running', 'interrupted', 'failed', 'cancelled']),
    )
    expect(extraProjectSpecs.some(({ lastRun }) => lastRun === 'none')).toBe(true)
  })

  it.each(lastStepCases)(
    'end the steps of a $runStatus run at its stage, with a $stepStatus step',
    ({ runStatus, stepStatus }) => {
      const run = extraRuns().find(({ status }) => status === runStatus)

      expect(extraRunSteps(run?.id ?? '')?.at(-1)).toMatchObject({
        stage: run?.current_stage,
        status: stepStatus,
      })
    },
  )

  it('have no steps for a run that is not one of them', () => {
    expect(extraRunSteps('no-such-run')).toBeUndefined()
  })
})

describe('bulkProjects', () => {
  it('makes as many projects as asked, with different ids, some archived', () => {
    const projects = bulkProjects(bulkProjectCount)

    expect(projects).toHaveLength(bulkProjectCount)
    expect(unique(projects.map(({ id }) => id))).toBe(true)
    expect(projects.some(({ status }) => status === 'archived')).toBe(true)
  })
})
