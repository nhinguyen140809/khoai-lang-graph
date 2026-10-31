import { describe, expect, it } from 'vitest'

import { openPage } from '@/test/msw'

import { runIds, threadIds } from '../../../shared/db'
import {
  findUnfinishedRun,
  latestRunOfEachThread,
  resolveRunConfig,
  runsOfThread,
} from '../runs.lookup'
import { resolveCases } from './runs.lookup.data'

describe('runsOfThread', () => {
  it('lists the runs of a thread only', () => {
    expect(runsOfThread(threadIds.mentorMain).map(({ number }) => number)).toEqual([1, 2, 3])
    expect(runsOfThread('no-such-thread')).toEqual([])
  })
})

describe('latestRunOfEachThread', () => {
  it('keeps the run of the highest number of each thread', () => {
    expect(latestRunOfEachThread().get(threadIds.mentorMain)?.id).toBe(runIds.mentorMain3)
  })

  it('has no entry for a thread without a run', () => {
    openPage('/?mock-runs=empty')

    expect(latestRunOfEachThread().size).toBe(0)
  })
})

describe('findUnfinishedRun', () => {
  it('finds the run of a thread that has not ended', () => {
    expect(findUnfinishedRun(threadIds.mentorMain)?.id).toBe(runIds.mentorMain3)
  })

  it('finds none when every run has ended', () => {
    openPage('/?mock-run-status=done')

    expect(findUnfinishedRun(threadIds.mentorMain)).toBeUndefined()
  })
})

describe('resolveRunConfig', () => {
  it.each(resolveCases)('resolves $name', ({ project, override, config }) => {
    expect(resolveRunConfig(project, override)).toEqual(config)
  })
})
