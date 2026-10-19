import { afterEach, describe, expect, it } from 'vitest'

import { apiUrl } from '@/shared/api/api-url.utils'

import { meCases, monthlyUsageCases } from './me.handlers.data'

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

describe('GET /me/usage', () => {
  it.each(monthlyUsageCases)('answers $name', async ({ address, status, body }) => {
    openPage(address)

    const answer = await fetch(apiUrl('/api/v1/me/usage'))

    expect(answer.status).toBe(status)
    expect(await answer.json()).toMatchObject(body)
  })

  it('counts the runs of the month of the mock data only, under 80% of the budget', async () => {
    const { total } = (await (await fetch(apiUrl('/api/v1/me/usage'))).json()) as {
      total: { cost_usd: number }
    }

    expect(total.cost_usd).toBeGreaterThan(0)
    expect(total.cost_usd).toBeLessThan(20 * 0.8)
  })
})
