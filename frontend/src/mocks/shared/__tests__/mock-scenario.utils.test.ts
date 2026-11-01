import { afterEach, describe, expect, it } from 'vitest'

import { answerScenario, mockScenario, pageParam } from '../mock-scenario.utils'

function openPage(address: string) {
  window.history.replaceState(null, '', address)
}

afterEach(() => {
  openPage('/')
})

describe('pageParam', () => {
  it('reads a parameter of the page address', () => {
    openPage('/login?mock-reset&next=%2Fsettings')

    expect(pageParam('next')).toBe('/settings')
    expect(pageParam('mock-reset')).toBe('')
    expect(pageParam('mock-me')).toBeNull()
  })
})

describe('mockScenario', () => {
  it.each(['empty', 'error', 'loading'])('reads the %s scenario of a resource', (scenario) => {
    openPage(`/?mock-me=${scenario}`)

    expect(mockScenario('me')).toBe(scenario)
  })

  it('answers the fixtures without a parameter, with an unknown value, or for another resource', () => {
    expect(mockScenario('me')).toBe('default')

    openPage('/?mock-me=broken')
    expect(mockScenario('me')).toBe('default')

    openPage('/?mock-threads=error')
    expect(mockScenario('me')).toBe('default')
  })
})

describe('answerScenario', () => {
  it('answers the error scenario with HTTP 500', async () => {
    const answer = await answerScenario('error')

    expect(answer?.status).toBe(500)
    expect(await answer?.json()).toMatchObject({ code: 'internal_error' })
  })

  it.each(['default', 'empty'] as const)(
    'leaves the %s scenario to the handler',
    async (scenario) => {
      await expect(answerScenario(scenario)).resolves.toBeNull()
    },
  )

  it('never answers the loading scenario', async () => {
    const first = await Promise.race([
      answerScenario('loading').then(() => 'answered'),
      new Promise((resolve) => setTimeout(resolve, 100, 'pending')),
    ])

    expect(first).toBe('pending')
  })
})
