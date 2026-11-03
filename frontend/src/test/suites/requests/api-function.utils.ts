import { expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { ApiError } from '@/shared/api/error'

import { recordRequests } from '../../msw'
import type { ApiErrorCase, SentRequestCase } from './api-function.types'

/**
 * Tests that each call sends the request it should. Only the request counts: the call may be
 * refused by the mock server for an id it does not hold, and its outcome is ignored.
 */
export function itSendsRequests(cases: readonly SentRequestCase[]) {
  it.each(cases)('$name', async ({ call, request }) => {
    const requests = recordRequests(Object.keys(request.headers ?? {}))

    await call().catch(() => undefined)

    await vi.waitFor(() => {
      expect(requests).toEqual([request])
    })
  })
}

/** Tests that each call throws an ApiError of the error given when its handler refuses it. */
export function itThrowsApiErrors(cases: readonly ApiErrorCase[]) {
  it.each(cases)('turns $name into an ApiError', async ({ refuse, call, error }) => {
    server.use(refuse())

    const caught: unknown = await call().catch((thrown: unknown) => thrown)

    expect(caught).toBeInstanceOf(ApiError)
    expect(caught).toMatchObject(error)
  })
}
