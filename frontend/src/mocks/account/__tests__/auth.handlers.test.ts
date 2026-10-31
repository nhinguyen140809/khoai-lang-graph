import { describe, expect, it } from 'vitest'

import type { Session } from '@/modules/user/entities'
import { apiEndpoint, apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, HttpStatus } from '@/shared/api/http'
import { apiUrl } from '@/shared/api/request'
import { fetchApi, getApiItems, openPage, postApi } from '@/test/msw'
import { expectStillPending } from '@/test/steps'
import { itRejectsRequests } from '@/test/suites'

import { sessionIds } from '../../shared/db'
import { authLoadingCases, authRejectedCases } from './auth.handlers.data'

describe('auth handlers', () => {
  it('answers 401 after logging out, until the user logs in again', async () => {
    expect((await fetchApi(apiEndpoints.me.path())).status).toBe(HttpStatus.Ok)

    expect((await postApi(apiEndpoints.logout.path())).status).toBe(HttpStatus.NoContent)
    expect(await fetchApi(apiEndpoints.me.path())).toMatchObject({
      status: HttpStatus.Unauthorized,
      body: { code: 'unauthenticated' },
    })

    expect(
      (
        await postApi(apiEndpoints.login.path(), {
          email: 'linh.pham@example.com',
          password: 'secret',
        })
      ).status,
    ).toBe(HttpStatus.NoContent)
    expect((await fetchApi(apiEndpoints.me.path())).status).toBe(HttpStatus.Ok)
  })

  it('lists the current session again after logging out and in', async () => {
    await postApi(apiEndpoints.logout.path())
    await postApi(apiEndpoints.login.path(), { email: 'linh.pham@example.com', password: 'secret' })

    const sessions = await getApiItems<Session>(apiEndpoints.sessions.path())

    expect(sessions.map(({ id }) => id)).toContain(sessionIds.current)
  })

  it('starts a new account from the default settings and the password of the register', async () => {
    await postApi(apiEndpoints.register.path(), {
      email: 'an@example.com',
      password: 'secret-pass-1',
      display_name: 'An',
    })

    expect(
      (
        await postApi(apiEndpoints.password.path(), {
          current_password: 'secret-pass-1',
          new_password: 'another-pass-2',
        })
      ).status,
    ).toBe(HttpStatus.NoContent)
    expect((await fetchApi(apiEndpoints.userSettings.path())).body).toMatchObject({
      theme: 'system',
      notify_on_run_finished: true,
    })
  })

  it('answers 401 to logging out without a session', async () => {
    expect((await postApi(apiEndpoints.logout.path())).status).toBe(HttpStatus.NoContent)

    expect((await postApi(apiEndpoints.logout.path())).status).toBe(HttpStatus.Unauthorized)
  })

  it('creates an account, the email in lower case and the name trimmed, that GET /me returns', async () => {
    const created = await postApi(apiEndpoints.register.path(), {
      email: 'An@Example.com',
      password: 'secret',
      display_name: '  An Tran  ',
    })

    expect(created.status).toBe(HttpStatus.Created)
    expect(created.headers.get(HttpHeader.Location)).toBe(apiEndpoints.me.path())
    expect(created.body).toMatchObject({ email: 'an@example.com', display_name: 'An Tran' })
    expect((await fetchApi(apiEndpoints.me.path())).body).toMatchObject({
      email: 'an@example.com',
      display_name: 'An Tran',
    })
  })

  itRejectsRequests(authRejectedCases)

  it.each(authLoadingCases)(
    'never answers $request in the loading scenario',
    async ({ address, path }) => {
      openPage(address)
      await expectStillPending(postApi(path, {}))
    },
  )

  it('lets registering and logging in through without a session', async () => {
    await postApi(apiEndpoints.logout.path())

    expect(
      (
        await postApi(apiEndpoints.register.path(), {
          email: 'an@example.com',
          password: 'secret',
          display_name: 'An',
        })
      ).status,
    ).toBe(HttpStatus.Created)
    expect(
      (await postApi(apiEndpoints.login.path(), { email: 'an@example.com', password: 'secret' }))
        .status,
    ).toBe(HttpStatus.NoContent)
  })

  it('leaves health, and any request without a mock, to the network', async () => {
    await expect(fetch(apiUrl(apiEndpoint('/no-mock').path()))).rejects.toThrow()

    await postApi(apiEndpoints.logout.path())
    await expect(fetch(apiUrl(apiEndpoints.health.path()))).rejects.toThrow()
  })
})
