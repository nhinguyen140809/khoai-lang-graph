import { describe, expect, it } from 'vitest'

import { isUnfinishedRunStatus } from '@/shared/config/run-status.constants'

import { mockArtifactItems, mockArtifacts } from '../../artifacts/artifacts.fixtures'
import { bulkProjectCount, extraProjectSpecs } from '../extra-project-specs.constants'
import {
  bulkProjects,
  extraMessages,
  extraProjects,
  extraRuns,
  extraRunSteps,
  extraThreads,
} from '../extra-projects.fixtures'
import { mockProjects } from '../projects.fixtures'

function unique(ids: string[]) {
  return new Set(ids).size === ids.length
}

describe('the extra projects of the mock data', () => {
  it('have an id of their own, apart from the projects of the API examples', () => {
    const ids = [...mockProjects, ...extraProjects()].map(({ id }) => id)

    expect(extraProjects()).toHaveLength(extraProjectSpecs.length)
    expect(unique(ids)).toBe(true)
  })

  it('have a thread each, one run at most, and the message that started it', () => {
    const threads = extraThreads()
    const runs = extraRuns()

    expect(threads).toHaveLength(extraProjectSpecs.length)
    for (const run of runs) {
      expect(threads.some((thread) => thread.id === run.thread_id)).toBe(true)
    }
    for (const message of extraMessages()) {
      expect(runs.some((run) => run.id === message.run_id)).toBe(true)
    }
    expect(unique(runs.map(({ thread_id }) => thread_id))).toBe(true)
  })

  it('show the unfinished run of a thread, and none for a thread whose last run ended', () => {
    for (const thread of extraThreads()) {
      const last = extraRuns()
        .filter((run) => run.thread_id === thread.id)
        .toSorted((a, b) => b.number - a.number)[0]
      const unfinished = last !== undefined && isUnfinishedRunStatus(last.status)

      expect(thread.active_run_id).toBe(unfinished ? last.id : null)
    }
  })

  it('cover every state of a run, and a project without a run', () => {
    const statuses = new Set(extraRuns().map(({ status }) => status))

    expect(statuses).toEqual(
      new Set(['succeeded', 'running', 'interrupted', 'failed', 'cancelled']),
    )
    expect(extraProjectSpecs.some(({ lastRun }) => lastRun === 'none')).toBe(true)
  })

  it('have steps that end as their run ended', () => {
    const failed = extraRuns().find(({ status }) => status === 'failed')
    const running = extraRuns().find(({ status }) => status === 'running')

    expect(extraRunSteps(failed?.id ?? '')?.at(-1)?.status).toBe('failed')
    expect(extraRunSteps(running?.id ?? '')?.at(-1)?.status).toBe('running')
    expect(extraRunSteps('no-such-run')).toBeUndefined()
  })

  it('have artifacts and items of their own, and every id is unique', () => {
    const withRun = extraProjectSpecs.filter(({ lastRun }) => lastRun !== 'none')
    const projectIds = new Set(mockArtifacts.map(({ project_id }) => project_id))

    expect(
      withRun.every(({ n }) =>
        projectIds.has(`90aa0000-0000-4000-8000-${String(n).padStart(12, '0')}`),
      ),
    ).toBe(true)
    expect(unique(mockArtifacts.map(({ id }) => id))).toBe(true)
    expect(unique(mockArtifactItems.map(({ id }) => id))).toBe(true)
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
