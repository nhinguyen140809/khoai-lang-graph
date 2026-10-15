import { afterEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { ApiError } from '@/shared/api/api-error.utils'

import { getMe } from '../account.api'
import { refusedCallCases, sentRequestCases } from './account.api.data'

/** Records the method, path and JSON body of every request until the test ends. */
function recordRequests() {
  const requests: { method: string; path: string; body: unknown }[] = []
  server.events.on('request:start', ({ request }) => {
    const copy = request.clone()
    void copy.text().then((text) => {
      requests.push({
        method: request.method,
        path: new URL(request.url).pathname,
        body: text === '' ? null : (JSON.parse(text) as unknown),
      })
    })
  })
  return requests
}

afterEach(() => {
  server.events.removeAllListeners()
})

describe('account api', () => {
  it('reads the signed-in user', async () => {
    await expect(getMe()).resolves.toMatchObject({
      email: 'linh.pham@example.com',
      display_name: 'Linh Pham',
    })
  })

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
