import { describe, expect, it } from 'vitest'

import { isUnfinishedRunStatus } from '@/modules/run/entities'
import { openPage } from '@/test/msw'

import { generatedProjects } from '../../generated/fixtures/generated-projects.fixtures'
import { allRuns } from '../../runs/lookup/runs.lookup'
import { changeRun } from '../../runs/runs.changes'
import { runIds, threadIds } from '../../shared/db'
import { changeThread, removeThread } from '../threads.changes'
import { allThreads, findThread } from '../threads.lookup'
import { generatedThreadCases, mentorRunStateCases } from './threads.lookup.data'

describe('allThreads', () => {
  it.each(mentorRunStateCases)(
    'derives the run fields of the mentor thread while its run $name',
    ({ address, thread }) => {
      openPage(address)

      expect(findThread(threadIds.mentorMain)).toMatchObject(thread)
    },
  )

  it('reads the status of a run stopped while the mock server runs, and no unfinished run', () => {
    changeRun(runIds.mentorMain3, { status: 'cancelled' })

    expect(findThread(threadIds.mentorMain)).toMatchObject({
      active_run_id: null,
      latest_run_status: 'cancelled',
    })
  })

  it('holds no run fields in the scenario without runs', () => {
    openPage('/?mock-runs=empty')

    expect(
      allThreads().every(
        ({ current_stage, active_run_id, latest_run_status }) =>
          current_stage === null && active_run_id === null && latest_run_status === null,
      ),
    ).toBe(true)
  })

  it('reads the time of the newest message as the time of the last message of a thread', () => {
    expect(findThread(threadIds.mentorMain)?.last_message_at).toBe('2026-10-06T08:30:40Z')
  })

  it('reads the creation time while the thread has no message', () => {
    const project = generatedProjects().find(({ name }) => name === 'Thesis tracker')

    const thread = allThreads().find(({ project_id }) => project_id === project?.id)
    expect(thread?.last_message_at).toBe(thread?.created_at)
  })

  it('reads the edit of a thread over its fixture', () => {
    changeThread(threadIds.campusMain, { title: 'Renamed', status: 'archived' })

    expect(findThread(threadIds.campusMain)).toMatchObject({ title: 'Renamed', status: 'archived' })
  })

  it('leaves a deleted thread out', () => {
    removeThread(threadIds.laundryMain)

    expect(findThread(threadIds.laundryMain)).toBeUndefined()
  })
})

describe('findThread', () => {
  it.each(generatedThreadCases)(
    'shows the unfinished run of $name on its thread, and none once its run ended',
    ({ projectId }) => {
      const thread = allThreads().find((candidate) => candidate.project_id === projectId)
      const last = allRuns()
        .filter((run) => run.project_id === projectId)
        .toSorted((a, b) => b.number - a.number)[0]
      const isUnfinished = last !== undefined && isUnfinishedRunStatus(last.status)

      expect(thread?.active_run_id).toBe(isUnfinished ? last.id : null)
    },
  )

  it('gives undefined for a thread the mock server does not hold', () => {
    expect(findThread('no-such-thread')).toBeUndefined()
  })
})
