import { afterEach, describe, expect, it } from 'vitest'

import type { Run, RunStep } from '@/features/threads'
import { apiUrl } from '@/shared/api/api-url.utils'

import { RUN_IDS, THREAD_IDS } from '../mock-ids.constants'

interface Page<T> {
  items: T[]
  next_cursor: string | null
}

interface Answer<T> {
  status: number
  body: T
}

// A scenario of the mocks is chosen in the page address.
function openPage(address: string) {
  window.history.replaceState(null, '', address)
}

async function call(path: string, init?: RequestInit) {
  const response = await fetch(apiUrl(path), init)
  const text = await response.text()
  const body: unknown = text === '' ? null : JSON.parse(text)
  return { status: response.status, body }
}

const cancel = (runId: string) => call(`/api/v1/runs/${runId}/cancel`, { method: 'POST' })

afterEach(() => {
  openPage('/')
})

describe('GET /threads/{thread_id}/runs', () => {
  it('lists the runs of a thread, the latest first', async () => {
    const { body } = (await call(`/api/v1/threads/${THREAD_IDS.mentorMain}/runs`)) as Answer<
      Page<Run>
    >

    expect(body.items.map(({ number }) => number)).toEqual([3, 2, 1])
    expect(body.items.map(({ status }) => status)).toEqual(['interrupted', 'failed', 'succeeded'])
  })

  it('lists no run for a thread without one', async () => {
    const { body } = (await call('/api/v1/threads/no-such-thread/runs')) as Answer<Page<Run>>

    expect(body.items).toEqual([])
  })

  it('answers the empty and error scenarios', async () => {
    openPage('/?mock-runs=empty')
    expect(
      ((await call(`/api/v1/threads/${THREAD_IDS.mentorMain}/runs`)) as Answer<Page<Run>>).body
        .items,
    ).toEqual([])

    openPage('/?mock-runs=error')
    expect((await call(`/api/v1/threads/${THREAD_IDS.mentorMain}/runs`)).status).toBe(500)
  })
})

describe('GET /runs/{run_id}', () => {
  it('answers run 3 of the API examples, a retry of run 2', async () => {
    const { status, body } = (await call(`/api/v1/runs/${RUN_IDS.mentorMain3}`)) as Answer<Run>

    expect(status).toBe(200)
    expect(body).toMatchObject({
      number: 3,
      status: 'interrupted',
      current_stage: 'analysis_review',
      retry_of_run_id: RUN_IDS.mentorMain2,
      step_count: 67,
      last_event_id: 246,
      finished_at: null,
    })
  })

  it.each([
    ['running', 'running', 66],
    ['failed', 'failed', 66],
    ['done', 'succeeded', null],
  ] as const)('follows the %s state of the run', async (state, status, stepCount) => {
    openPage(`/?mock-run-state=${state}`)

    const { body } = (await call(`/api/v1/runs/${RUN_IDS.mentorMain3}`)) as Answer<Run>
    const steps = (await call(`/api/v1/runs/${RUN_IDS.mentorMain3}/steps?limit=200`)) as Answer<
      Page<RunStep>
    >

    expect(body.status).toBe(status)
    expect(body.step_count).toBe(steps.body.items.length)
    if (stepCount !== null) expect(body.step_count).toBe(stepCount)
    expect(body.finished_at === null).toBe(state === 'running')
  })

  it('answers 404 for a run that does not exist', async () => {
    expect((await call('/api/v1/runs/no-such-run')).status).toBe(404)
  })
})

describe('GET /runs/{run_id}/steps', () => {
  it('answers the steps in order, in pages', async () => {
    const first = (await call(`/api/v1/runs/${RUN_IDS.mentorMain3}/steps`)) as Answer<Page<RunStep>>
    const second = (await call(
      `/api/v1/runs/${RUN_IDS.mentorMain3}/steps?cursor=${String(first.body.next_cursor)}`,
    )) as Answer<Page<RunStep>>
    const steps = [...first.body.items, ...second.body.items]

    expect(first.body.items).toHaveLength(50)
    expect(second.body.next_cursor).toBeNull()
    expect(steps.map(({ sequence }) => sequence)).toEqual(
      Array.from({ length: 67 }, (_, index) => index + 1),
    )
    expect(steps.at(-1)).toMatchObject({ node: 'checkpoint_analysis', status: 'running' })
  })

  it('answers 404 for a run that does not exist', async () => {
    expect((await call('/api/v1/runs/no-such-run/steps')).status).toBe(404)
  })
})

describe('POST /runs/{run_id}/cancel', () => {
  it('stops an unfinished run', async () => {
    expect((await cancel(RUN_IDS.mentorMain3)).status).toBe(202)

    const { body } = (await call(`/api/v1/runs/${RUN_IDS.mentorMain3}`)) as Answer<Run>
    expect(body.status).toBe('cancelled')
    expect(body.finished_at).not.toBeNull()
  })

  it('answers 409 for a run that has ended', async () => {
    await cancel(RUN_IDS.mentorMain3)

    expect(await cancel(RUN_IDS.mentorMain3)).toMatchObject({
      status: 409,
      body: { code: 'invalid_state' },
    })
    expect((await cancel(RUN_IDS.mentorMain1)).status).toBe(409)
  })

  it('answers 404 for a run that does not exist', async () => {
    expect((await cancel('no-such-run')).status).toBe(404)
  })
})
