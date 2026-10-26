import { afterEach, describe, expect, it } from 'vitest'

import { addressParam, answerScenario, mockScenario } from '../mock-scenario.utils'
import {
  addressWithParams,
  chosenScenarios,
  fixtureScenarioCases,
  handlerScenarioCases,
  pageParamCases,
} from './mock-scenario.utils.data'

function openPage(address: string) {
  window.history.replaceState(null, '', address)
}

afterEach(() => {
  openPage('/')
})

describe('pageParam', () => {
  it.each(pageParamCases)('reads $name', ({ param, value }) => {
    openPage(addressWithParams)

    expect(addressParam(param)).toBe(value)
  })
})

describe('mockScenario', () => {
  it.each(chosenScenarios)('reads the %s scenario of a resource', (scenario) => {
    openPage(`/?mock-me=${scenario}`)

    expect(mockScenario('me')).toBe(scenario)
  })

  it.each(fixtureScenarioCases)('answers the fixtures $name', ({ address }) => {
    openPage(address)

    expect(mockScenario('me')).toBe('default')
  })
})

describe('answerScenario', () => {
  it('throws HTTP 500 for the error scenario, which MSW sends as the response', async () => {
    openPage('/?mock-me=error')

    const thrown: unknown = await answerScenario('me').catch((error: unknown) => error)

    expect(thrown).toBeInstanceOf(Response)
    expect((thrown as Response).status).toBe(500)
    expect(await (thrown as Response).json()).toMatchObject({ code: 'internal_error' })
  })

  it.each(handlerScenarioCases)('leaves $name to the handler', async ({ address, scenario }) => {
    openPage(address)

    await expect(answerScenario('me')).resolves.toBe(scenario)
  })

  it('never answers the loading scenario', async () => {
    openPage('/?mock-me=loading')
    const first = await Promise.race([
      answerScenario('me').then(() => 'answered'),
      new Promise((resolve) => setTimeout(resolve, 100, 'pending')),
    ])

    expect(first).toBe('pending')
  })
})
