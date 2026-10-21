import { afterEach, describe, expect, it } from 'vitest'

import type { Run, RunStep } from '@/modules/run/entities'
import { apiUrl } from '@/shared/api/api-url.utils'

import { runIds } from '../../shared/mock-ids.constants'
import { mockRunId } from '../runs.handlers'
import {
  runErrorCases,
  runListCases,
  runStateCases,
  unfinishedRunStates,
} from './runs.handlers.data'

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
  it.each(runListCases)('lists $name', async ({ address, threadId, runs }) => {
    openPage(address)

    const { body } = (await call(`/api/v1/threads/${threadId}/runs`)) as Answer<Page<Run>>

    expect(body.items.map(({ number, status }) => ({ number, status }))).toEqual(runs)
  })
})

describe('GET /runs/{run_id}', () => {
  it('answers run 3 of the API examples, a retry of run 2', async () => {
    const { status, body } = (await call(`/api/v1/runs/${runIds.mentorMain3}`)) as Answer<Run>

    expect(status).toBe(200)
    expect(body).toMatchObject({
      number: 3,
      status: 'interrupted',
      current_stage: 'analysis_review',
      retry_of_run_id: runIds.mentorMain2,
      step_count: 67,
      last_event_id: 246,
      finished_at: null,
    })
  })

  it.each(runStateCases)(
    'follows the $state state of the run',
    async ({ state, status, stepCount, finished }) => {
      openPage(`/?mock-run-state=${state}`)

      const { body } = (await call(`/api/v1/runs/${runIds.mentorMain3}`)) as Answer<Run>
      const steps = (await call(`/api/v1/runs/${runIds.mentorMain3}/steps?limit=200`)) as Answer<
        Page<RunStep>
      >

      expect(body).toMatchObject({ status, step_count: stepCount })
      expect(steps.body.items).toHaveLength(stepCount)
      expect(body.finished_at !== null).toBe(finished)
    },
  )
})

describe('GET /runs/{run_id}/steps', () => {
  it('answers the steps in order, in pages', async () => {
    const first = (await call(`/api/v1/runs/${runIds.mentorMain3}/steps`)) as Answer<Page<RunStep>>
    const second = (await call(
      `/api/v1/runs/${runIds.mentorMain3}/steps?cursor=${String(first.body.next_cursor)}`,
    )) as Answer<Page<RunStep>>
    const steps = [...first.body.items, ...second.body.items]

    expect(first.body.items).toHaveLength(50)
    expect(second.body.next_cursor).toBeNull()
    expect(steps.map(({ sequence }) => sequence)).toEqual(
      Array.from({ length: 67 }, (_, index) => index + 1),
    )
    expect(steps.at(-1)).toMatchObject({ node: 'checkpoint_analysis', status: 'running' })
  })
})

describe('POST /runs/{run_id}/cancel', () => {
  it.each(unfinishedRunStates)('stops a run that is %s, once', async (state) => {
    openPage(`/?mock-run-state=${state}`)

    expect((await cancel(runIds.mentorMain3)).status).toBe(202)

    const { body } = (await call(`/api/v1/runs/${runIds.mentorMain3}`)) as Answer<Run>
    expect(body.status).toBe('cancelled')
    expect(body.finished_at).not.toBeNull()
    expect(await cancel(runIds.mentorMain3)).toMatchObject({
      status: 409,
      body: { code: 'invalid_state' },
    })
  })
})

describe('the run of the chat', () => {
  it('answers the id of the mock run', async () => {
    const { body } = (await call('/api/v1/threads/t1/runs', { method: 'POST' })) as Answer<{
      run_id: string
    }>

    expect(body).toEqual({ run_id: mockRunId })
  })
})

describe('errors', () => {
  it.each(runErrorCases)(
    'answers $status to $request',
    async ({ address, method, path, status, code }) => {
      openPage(address)

      expect(await call(path, { method })).toMatchObject({ status, body: { code } })
    },
  )
})
