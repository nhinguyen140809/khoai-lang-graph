import { afterEach, describe, expect, it } from 'vitest'

import { answerScenario, mockScenario, pageParam } from '../mock-scenario.utils'
import {
  addressWithParams,
  chosenScenarios,
  fixtureScenarioCases,
  handlerScenarios,
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

    expect(pageParam(param)).toBe(value)
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
  it('answers the error scenario with HTTP 500', async () => {
    const answer = await answerScenario('error')

    expect(answer?.status).toBe(500)
    expect(await answer?.json()).toMatchObject({ code: 'internal_error' })
  })

  it.each(handlerScenarios)('leaves the %s scenario to the handler', async (scenario) => {
    await expect(answerScenario(scenario)).resolves.toBeNull()
  })

  it('never answers the loading scenario', async () => {
    const first = await Promise.race([
      answerScenario('loading').then(() => 'answered'),
      new Promise((resolve) => setTimeout(resolve, 100, 'pending')),
    ])

    expect(first).toBe('pending')
  })
})
