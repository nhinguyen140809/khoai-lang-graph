import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { ApiError } from '@/shared/api/api-error.utils'

import { getMe, login, logout, register } from '../account.api'

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

  it('sends the credentials to sign in, register and sign out', async () => {
    const requests = recordRequests()

    await login({ email: 'linh.pham@example.com', password: 'secret' })
    await register({ email: 'an@example.com', password: 'secret', display_name: 'An Tran' })
    await logout()

    await vi.waitFor(() => {
      expect(requests).toEqual([
        {
          method: 'POST',
          path: '/api/v1/auth/login',
          body: { email: 'linh.pham@example.com', password: 'secret' },
        },
        {
          method: 'POST',
          path: '/api/v1/auth/register',
          body: { email: 'an@example.com', password: 'secret', display_name: 'An Tran' },
        },
        { method: 'POST', path: '/api/v1/auth/logout', body: null },
      ])
    })
  })

  it('turns a refused sign-in into an ApiError', async () => {
    server.use(
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json({ status: 401, code: 'unauthenticated' }, { status: 401 }),
      ),
    )

    const error: unknown = await login({ email: 'a@example.com', password: 'x' }).catch(
      (caught: unknown) => caught,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 401, message: 'Failed to sign in (HTTP 401)' })
  })
})
