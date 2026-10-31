import { describe, expect, it } from 'vitest'

import type { Session } from '@/modules/user/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import { apiUrl } from '@/shared/api/request'
import { fetchApi, getApiItems, openPage, patchApi, postApi } from '@/test/msw'
import { expectStillPending } from '@/test/steps'
import { itRejectsRequests } from '@/test/suites'

import { sessionIds } from '../../shared/db'
import { mePasswordFixture } from '../me.fixtures'
import { meCases, meRejectedCases } from './me.handlers.data'

// A scenario of the mocks is chosen in the page address.
describe('me handlers', () => {
  it.each(meCases)('answers $name', async ({ address, status, body }) => {
    openPage(address)

    expect(await fetchApi(apiEndpoints.me.path())).toMatchObject({ status, body })
  })

  it('changes the name, trimmed, that GET /me then reads', async () => {
    const changed = await patchApi(apiEndpoints.me.path(), { display_name: '  Linh P.  ' })

    expect(changed).toMatchObject({ status: HttpStatus.Ok, body: { display_name: 'Linh P.' } })
    expect((await fetchApi(apiEndpoints.me.path())).body).toMatchObject({
      display_name: 'Linh P.',
      email: 'linh.pham@example.com',
    })
  })

  it('changes the password, and ends the other sessions', async () => {
    const body = { current_password: mePasswordFixture, new_password: 'long-enough-1' }

    expect((await postApi(apiEndpoints.password.path(), body)).status).toBe(HttpStatus.NoContent)

    expect((await postApi(apiEndpoints.password.path(), body)).status).toBe(
      HttpStatus.UnprocessableContent,
    )
    const sessions = await getApiItems<Session>(apiEndpoints.sessions.path())
    expect(sessions.map(({ id }) => id)).toEqual([sessionIds.current])
  })

  itRejectsRequests(meRejectedCases)

  it('never answers in the loading scenario', async () => {
    openPage('/?mock-me=loading')
    const controller = new AbortController()

    const request = fetch(apiUrl(apiEndpoints.me.path()), { signal: controller.signal }).then(
      () => 'answered',
      () => 'aborted',
    )
    await expectStillPending(request)
    controller.abort()

    expect(await request).toBe('aborted')
  })
})
