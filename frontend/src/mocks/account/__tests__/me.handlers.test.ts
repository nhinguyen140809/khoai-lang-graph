import { afterEach, describe, expect, it } from 'vitest'

import { apiUrl } from '@/shared/api/api-url.utils'

// A scenario of the mocks is chosen in the page address.
function openPage(address: string) {
  window.history.replaceState(null, '', address)
}

afterEach(() => {
  openPage('/')
})

describe('me handlers', () => {
  it('answers the signed-in user', async () => {
    const answer = await fetch(apiUrl('/api/v1/me'))

    expect(answer.status).toBe(200)
    expect(await answer.json()).toMatchObject({
      email: 'linh.pham@example.com',
      display_name: 'Linh Pham',
    })
  })

  it('answers 500 in the error scenario', async () => {
    openPage('/?mock-me=error')

    const answer = await fetch(apiUrl('/api/v1/me'))

    expect(answer.status).toBe(500)
    expect(await answer.json()).toMatchObject({ code: 'internal_error' })
  })

  it('answers 404 in the empty scenario', async () => {
    openPage('/?mock-me=empty')

    const answer = await fetch(apiUrl('/api/v1/me'))

    expect(answer.status).toBe(404)
    expect(await answer.json()).toMatchObject({
      code: 'not_found',
      detail: 'The user does not exist.',
    })
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
