import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { apiUrl } from '@/shared/api/request'

import { idempotent } from '../idempotency.utils'
import { type KeyedRequest, separateRequestCases } from './idempotency.utils.data'

// A handler that counts the work it does and answers with that count. Its calls answer the
// statuses given in turn, then 201.
function useCountingHandler(...statuses: number[]) {
  const state = { works: 0 }
  server.use(
    http.post(
      '/api/v1/things/:id/start',
      idempotent(() => {
        state.works += 1
        return HttpResponse.json(
          { work: state.works },
          { status: statuses[state.works - 1] ?? 201 },
        )
      }),
    ),
  )
  return state
}

async function send(request: KeyedRequest, id = '1') {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (request.key !== null) headers['Idempotency-Key'] = request.key
  const response = await fetch(apiUrl(`/api/v1/things/${id}/start`), {
    method: 'POST',
    headers,
    body: JSON.stringify(request.body),
  })
  return { status: response.status, body: (await response.json()) as unknown }
}

describe('idempotent', () => {
  it.each(separateRequestCases)('does the work for each of $name', async ({ requests, works }) => {
    const state = useCountingHandler()

    for (const request of requests) await send(request)

    expect(state.works).toBe(works)
  })

  it('answers a repeated key with the first answer, without doing the work again', async () => {
    const state = useCountingHandler()

    const first = await send({ key: 'k1', body: { a: 1 } })
    const second = await send({ key: 'k1', body: { a: 1 } })

    expect(first).toEqual({ status: 201, body: { work: 1 } })
    expect(second).toEqual(first)
    expect(state.works).toBe(1)
  })

  it('answers 409 to the same key with another body', async () => {
    const state = useCountingHandler()
    await send({ key: 'k1', body: { a: 1 } })

    expect(await send({ key: 'k1', body: { a: 2 } })).toMatchObject({
      status: 409,
      body: { code: 'idempotency_conflict' },
    })
    expect(state.works).toBe(1)
  })

  it('keeps a key for the path it came with', async () => {
    const state = useCountingHandler()

    await send({ key: 'k1', body: { a: 1 } }, '1')
    await send({ key: 'k1', body: { a: 1 } }, '2')

    expect(state.works).toBe(2)
  })

  it('does not keep an answer with an error status', async () => {
    const state = useCountingHandler(500)

    const failed = await send({ key: 'k1', body: { a: 1 } })
    const retried = await send({ key: 'k1', body: { a: 1 } })

    expect(failed.status).toBe(500)
    expect(retried.status).toBe(201)
    expect(state.works).toBe(2)
  })
})
