import { describe, expect, it } from 'vitest'

import { apiEndpoints } from '@/shared/api/endpoints'
import { apiUrl } from '@/shared/api/request'
import { fetchApi, openPage } from '@/test/msw'
import { expectStillPending } from '@/test/steps'

import { meCases } from './me.handlers.data'

// A scenario of the mocks is chosen in the page address.
describe('me handlers', () => {
  it.each(meCases)('answers $name', async ({ address, status, body }) => {
    openPage(address)

    expect(await fetchApi(apiEndpoints.me.path())).toMatchObject({ status, body })
  })

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
