import { describe, expect, it } from 'vitest'

import type { Run, RunStep } from '@/modules/run/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import type { ListPage } from '@/shared/api/request'
import type { ApiAnswer } from '@/test/msw'
import { fetchApi, openPage } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import { changeProject } from '../../../projects/projects.lookup'
import { projectIds, runIds, startedRunId } from '../../../shared/db'
import { stepsOfRun } from '../../lookup/runs.lookup'
import {
  refusedRetryCases,
  runErrorCases,
  runListCases,
  runStatusScenarioCases,
  unfinishedRunStates,
} from './runs.handlers.data'

// A scenario of the mocks is chosen in the page address.
const cancel = (runId: string) =>
  fetchApi(apiEndpoints.runCancel.path({ runId }), { method: 'POST' })

describe('GET /threads/{thread_id}/runs', () => {
  it.each(runListCases)('lists $name', async ({ address, threadId, runs }) => {
    openPage(address)

    const { body } = (await fetchApi(apiEndpoints.threadRuns.path({ threadId }))) as ApiAnswer<
      ListPage<Run>
    >

    expect(body.items.map(({ number, status }) => ({ number, status }))).toEqual(runs)
  })
})

describe('GET /runs/{run_id}', () => {
  it('answers run 3 of the API examples, a retry of run 2', async () => {
    const { status, body } = (await fetchApi(
      apiEndpoints.run.path({ runId: runIds.mentorMain3 }),
    )) as ApiAnswer<Run>

    expect(status).toBe(HttpStatus.Ok)
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

  it.each(runStatusScenarioCases)(
    'follows the $state state of the run',
    async ({ state, status, stepCount, finished }) => {
      openPage(`/?mock-run-status=${state}`)

      const { body } = (await fetchApi(
        apiEndpoints.run.path({ runId: runIds.mentorMain3 }),
      )) as ApiAnswer<Run>
      const steps = (await fetchApi(
        `${apiEndpoints.runSteps.path({ runId: runIds.mentorMain3 })}?limit=200`,
      )) as ApiAnswer<ListPage<RunStep>>

      expect(body).toMatchObject({ status, step_count: stepCount })
      expect(steps.body.items).toHaveLength(stepCount)
      expect(body.finished_at !== null).toBe(finished)
    },
  )
})

describe('GET /runs/{run_id}/steps', () => {
  it('answers the steps in order, in pages', async () => {
    const first = (await fetchApi(
      apiEndpoints.runSteps.path({ runId: runIds.mentorMain3 }),
    )) as ApiAnswer<ListPage<RunStep>>
    const second = (await fetchApi(
      `${apiEndpoints.runSteps.path({ runId: runIds.mentorMain3 })}?cursor=${String(first.body.next_cursor)}`,
    )) as ApiAnswer<ListPage<RunStep>>
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
    openPage(`/?mock-run-status=${state}`)

    expect((await cancel(runIds.mentorMain3)).status).toBe(HttpStatus.Accepted)

    const { body } = (await fetchApi(
      apiEndpoints.run.path({ runId: runIds.mentorMain3 }),
    )) as ApiAnswer<Run>
    expect(body.status).toBe('cancelled')
    expect(body.finished_at).not.toBeNull()
    expect(await cancel(runIds.mentorMain3)).toMatchObject({
      status: HttpStatus.Conflict,
      body: { code: 'invalid_state' },
    })
  })
})

describe('the run of the chat', () => {
  it('answers the id of the mock run', async () => {
    const { body } = (await fetchApi(apiEndpoints.threadRuns.path({ threadId: 't1' }), {
      method: 'POST',
    })) as ApiAnswer<{
      run_id: string
    }>

    expect(body).toEqual({ run_id: startedRunId })
  })
})

describe('errors', () => {
  itRejectsRequests(runErrorCases)
})

describe('POST /runs/{run_id}/retry', () => {
  itRejectsRequests(refusedRetryCases)

  it('starts a run that resolves the settings saved since the run it retries', async () => {
    openPage('/?mock-run-status=done')
    changeProject(projectIds.mentor, ({ run_config: runConfig }) => ({
      run_config: { ...runConfig, max_cost_usd: 9 },
    }))
    const [step] = stepsOfRun(runIds.mentorMain2)

    const { status, body } = (await fetchApi(
      apiEndpoints.runRetry.path({ runId: runIds.mentorMain2 }),
      {
        method: 'POST',
        body: JSON.stringify({ from_step_id: step?.id }),
      },
    )) as ApiAnswer<Run>

    expect(status).toBe(HttpStatus.Created)
    expect(body).toMatchObject({ retry_of_run_id: runIds.mentorMain2, status: 'queued' })
    expect(body.run_config.max_cost_usd).toBe(9)
  })
})
