import { afterEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { ApiError } from '@/shared/api/api-error.utils'
import { recordRequests, stopRecordingRequests } from '@/test/recorded-requests.utils'

import { refusedCallCases, sentRequestCases } from './auth.api.data'

afterEach(stopRecordingRequests)

describe('auth api', () => {
  it.each(sentRequestCases)('$name', async ({ call, request }) => {
    const requests = recordRequests()

    await call()

    await vi.waitFor(() => {
      expect(requests).toEqual([request])
    })
  })

  it.each(refusedCallCases)('turns $name into an ApiError', async ({ refuse, call, error }) => {
    server.use(refuse())

    const caught: unknown = await call().catch((thrown: unknown) => thrown)

    expect(caught).toBeInstanceOf(ApiError)
    expect(caught).toMatchObject(error)
  })
})
