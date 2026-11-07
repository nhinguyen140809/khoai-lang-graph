import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { runStepFixtures } from '@/mocks/runs/fixtures/runs.fixtures'
import { runIds, threadIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { openPage } from '@/test/msw'
import { itSendsRequests } from '@/test/suites'

import { cancelRun, findLatestRun, getRun, listThreadRuns, retryRun } from '../runs.api'
import { emptyRunPageAnswer, sentRunRequestCases, threadRunCases } from './runs.api.data'

describe('listThreadRuns', () => {
  it.each(threadRunCases)('lists the runs of $name', async ({ threadId, numbers }) => {
    const page = await listThreadRuns(threadId, null, 50)

    expect(page.items.map(({ number }) => number)).toEqual(numbers)
    expect(page.next_cursor).toBeNull()
  })
})

describe('findLatestRun', () => {
  it('reads the newest run of a thread', async () => {
    await expect(findLatestRun(threadIds.mentorMain)).resolves.toMatchObject({
      id: runIds.mentorMain3,
      number: 3,
    })
  })

  it('gives null for a thread without a run', async () => {
    server.use(http.get(apiEndpoints.threadRuns.pattern, emptyRunPageAnswer))

    await expect(findLatestRun(threadIds.mentorMain)).resolves.toBeNull()
  })
})

describe('getRun', () => {
  it('reads one run, with the run it retries', async () => {
    await expect(getRun(runIds.mentorMain3)).resolves.toMatchObject({
      id: runIds.mentorMain3,
      retry_of_run_id: runIds.mentorMain2,
    })
  })

  it('throws for a run that does not exist', async () => {
    await expect(getRun('missing')).rejects.toThrow('HTTP 404')
  })
})

describe('cancelRun', () => {
  it('stops a run that has not ended', async () => {
    await expect(cancelRun(runIds.mentorMain3)).resolves.toBeUndefined()
    await expect(getRun(runIds.mentorMain3)).resolves.toMatchObject({ status: 'cancelled' })
  })

  it('throws for a run that has ended', async () => {
    await expect(cancelRun(runIds.mentorMain1)).rejects.toThrow('HTTP 409')
  })
})

describe('retryRun', () => {
  it('starts a new run of the same thread from a step of a run, and gives it', async () => {
    openPage('/?mock-run-status=done')
    const [step] = runStepFixtures(runIds.mentorMain2, 'done')

    const run = await retryRun(runIds.mentorMain2, step?.id ?? '', 'retry-1')

    expect(run).toMatchObject({
      thread_id: threadIds.mentorMain,
      number: 4,
      status: 'queued',
      retry_of_run_id: runIds.mentorMain2,
    })
  })

  it('throws while the thread has a run that has not ended', async () => {
    const [step] = runStepFixtures(runIds.mentorMain2, 'waiting')

    await expect(retryRun(runIds.mentorMain2, step?.id ?? '', 'retry-2')).rejects.toThrow(
      'HTTP 409',
    )
  })

  it('throws for a step that is not a step of the run', async () => {
    openPage('/?mock-run-status=done')

    await expect(retryRun(runIds.mentorMain2, 'missing', 'retry-3')).rejects.toThrow('HTTP 422')
  })

  itSendsRequests(sentRunRequestCases)
})
