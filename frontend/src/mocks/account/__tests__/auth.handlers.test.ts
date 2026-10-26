import { afterEach, describe, expect, it } from 'vitest'

import { apiEndpoints } from '@/shared/api/endpoints'
import { apiUrl } from '@/shared/api/request'

import { authLoadingCases, authProblemCases } from './auth.handlers.data'

// The body goes as it is, so a case can also send text that is not JSON.
const send = (path: string, body: string) =>
  fetch(apiUrl(path), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })

const post = (path: string, body?: unknown) => send(path, JSON.stringify(body ?? {}))

// A scenario of the mocks is chosen in the page address.
function openPage(address: string) {
  window.history.replaceState(null, '', address)
}

afterEach(() => {
  openPage('/')
})

describe('auth handlers', () => {
  it('answers 401 after logging out, until the user logs in again', async () => {
    expect((await fetch(apiUrl(apiEndpoints.me.path()))).status).toBe(200)

    expect((await post(apiEndpoints.logout.path())).status).toBe(204)
    const signedOut = await fetch(apiUrl('/api/v1/me'))
    expect(signedOut.status).toBe(401)
    expect(await signedOut.json()).toMatchObject({ code: 'unauthenticated' })

    expect(
      (
        await post(apiEndpoints.login.path(), {
          email: 'linh.pham@example.com',
          password: 'secret',
        })
      ).status,
    ).toBe(204)
    expect((await fetch(apiUrl(apiEndpoints.me.path()))).status).toBe(200)
  })

  it('answers 401 to logging out without a session', async () => {
    expect((await post(apiEndpoints.logout.path())).status).toBe(204)

    expect((await post(apiEndpoints.logout.path())).status).toBe(401)
  })

  it('creates an account, the email in lower case and the name trimmed, that GET /me returns', async () => {
    const created = await post(apiEndpoints.register.path(), {
      email: 'An@Example.com',
      password: 'secret',
      display_name: '  An Tran  ',
    })

    expect(created.status).toBe(201)
    expect(created.headers.get('Location')).toBe(apiEndpoints.me.path())
    expect(await created.json()).toMatchObject({ email: 'an@example.com', display_name: 'An Tran' })
    expect(await (await fetch(apiUrl(apiEndpoints.me.path()))).json()).toMatchObject({
      email: 'an@example.com',
      display_name: 'An Tran',
    })
  })

  it.each(authProblemCases)(
    'answers $status to $request',
    async ({ address, path, body, status, problem }) => {
      openPage(address)

      const answer = await send(path, body)

      expect(answer.status).toBe(status)
      expect(await answer.json()).toMatchObject(problem)
    },
  )

  it.each(authLoadingCases)(
    'never answers $request in the loading scenario',
    async ({ address, path }) => {
      openPage(address)
      const first = await Promise.race([
        post(path).then(() => 'answered'),
        new Promise((resolve) => setTimeout(resolve, 100, 'pending')),
      ])

      expect(first).toBe('pending')
    },
  )

  it('lets creating an account and logging in through without a session', async () => {
    await post(apiEndpoints.logout.path())

    expect(
      (
        await post(apiEndpoints.register.path(), {
          email: 'an@example.com',
          password: 'secret',
          display_name: 'An',
        })
      ).status,
    ).toBe(201)
    expect(
      (await post(apiEndpoints.login.path(), { email: 'an@example.com', password: 'secret' }))
        .status,
    ).toBe(204)
  })

  it('leaves health, and any request without a mock, to the network', async () => {
    await expect(fetch(apiUrl('/api/v1/no-mock'))).rejects.toThrow()

    await post(apiEndpoints.logout.path())
    await expect(fetch(apiUrl(apiEndpoints.health.path()))).rejects.toThrow()
  })
})
