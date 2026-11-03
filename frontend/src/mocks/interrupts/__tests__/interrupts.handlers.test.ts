import { describe, expect, it } from 'vitest'

import type { Interrupt } from '@/modules/review/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, HttpStatus } from '@/shared/api/http'
import type { ListPage } from '@/shared/api/request'
import { assertPresent } from '@/shared/lib/guards'
import { type ApiAnswer, fetchApi, getApiItems, openPage, postApi } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import { findRun } from '../../runs/lookup/runs.lookup'
import { runIds } from '../../shared/db'
import { pendingInterruptOf } from '../interrupts.lookup'
import { refusedRequestCases } from './interrupts.handlers.data'

// The interrupt that run 3 of the mentor thread waits for, as the mock server holds it.
function pendingReview(): Interrupt {
  const run = assertPresent(findRun(runIds.mentorMain3), 'The mock data holds run 3.')
  return assertPresent(pendingInterruptOf(run), 'Run 3 waits for a review.')
}

const interruptsPath = (query: string) =>
  `${apiEndpoints.runInterrupts.path({ runId: runIds.mentorMain3 })}${query}`

describe('GET /runs/{run_id}/interrupts', () => {
  it('lists the interrupts of the run in the order of its steps', async () => {
    const items = await getApiItems<Interrupt>(interruptsPath('?limit=100'))

    expect(items.map(({ node, status }) => ({ node, status }))).toEqual([
      { node: 'checkpoint_personas', status: 'resolved' },
      { node: 'checkpoint_analysis', status: 'pending' },
    ])
  })

  it('keeps the interrupts of the status the address names', async () => {
    const items = await getApiItems<Interrupt>(interruptsPath('?status=pending'))

    expect(items.map(({ status }) => status)).toEqual(['pending'])
  })

  it('answers no interrupt in the empty scenario', async () => {
    openPage('/?mock-interrupts=empty')

    expect(await getApiItems<Interrupt>(interruptsPath('?limit=100'))).toEqual([])
  })

  it('answers the interrupts in pages', async () => {
    const first = (await fetchApi(interruptsPath('?limit=1'))) as ApiAnswer<ListPage<Interrupt>>
    const second = (await fetchApi(
      interruptsPath(`?limit=1&cursor=${String(first.body.next_cursor)}`),
    )) as ApiAnswer<ListPage<Interrupt>>

    expect(first.body.items).toHaveLength(1)
    expect(second.body.next_cursor).toBeNull()
    expect([...first.body.items, ...second.body.items].map(({ node }) => node)).toEqual([
      'checkpoint_personas',
      'checkpoint_analysis',
    ])
  })
})

describe('POST /runs/{run_id}/resume', () => {
  itRejectsRequests(refusedRequestCases)

  it('answers with the run that goes on, and resolves the interrupt', async () => {
    const pending = pendingReview()

    const answered = await postApi(apiEndpoints.runResume.path({ runId: runIds.mentorMain3 }), {
      interrupt_id: pending.id,
      option: 'accept',
      feedback: null,
      answers: {},
      modified_items: [],
    })

    expect(answered).toMatchObject({
      status: HttpStatus.Accepted,
      body: { status: 'running', current_stage: 'specification' },
    })
    expect(await getApiItems<Interrupt>(interruptsPath('?limit=100'))).toMatchObject([
      { status: 'resolved' },
      { status: 'resolved' },
    ])
  })

  it('answers a repeat with the same key with the first answer', async () => {
    const body = {
      interrupt_id: pendingReview().id,
      option: 'accept',
      feedback: null,
      answers: {},
      modified_items: [],
    }
    const path = apiEndpoints.runResume.path({ runId: runIds.mentorMain3 })
    const headers = { [HttpHeader.IdempotencyKey]: 'answer-once' }

    const first = await postApi(path, body, headers)
    const repeat = await postApi(path, body, headers)

    expect(repeat.status).toBe(HttpStatus.Accepted)
    expect(repeat.body).toEqual(first.body)
  })
})
