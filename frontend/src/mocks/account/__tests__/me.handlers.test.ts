import { afterEach, describe, expect, it } from 'vitest'

import { apiUrl } from '@/shared/api/request'

import { meCases } from './me.handlers.data'

// A scenario of the mocks is chosen in the page address.
function openPage(address: string) {
  window.history.replaceState(null, '', address)
}

afterEach(() => {
  openPage('/')
})

describe('me handlers', () => {
  it.each(meCases)('answers $name', async ({ address, status, body }) => {
    openPage(address)

    const answer = await fetch(apiUrl('/api/v1/me'))

    expect(answer.status).toBe(status)
    expect(await answer.json()).toMatchObject(body)
  })

  it('never answers in the loading scenario', async () => {
    openPage('/?mock-me=loading')
    const controller = new AbortController()

    const request = fetch(apiUrl('/api/v1/me'), { signal: controller.signal }).then(
      () => 'answered',
      () => 'aborted',
    )
    const first = await Promise.race([
      request,
      new Promise((resolve) => setTimeout(resolve, 100, 'pending')),
    ])
    controller.abort()

    expect(first).toBe('pending')
    expect(await request).toBe('aborted')
  })
})
