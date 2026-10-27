import { describe, expect, it } from 'vitest'

import { HttpStatus } from '@/shared/api/http'
import { openPage } from '@/test/msw'
import { expectStillPending } from '@/test/steps'

import { answerScenario, mockScenario, pageUrlParam } from '../mock-scenario.utils'
import {
  chosenScenarios,
  fixtureScenarioCases,
  handlerScenarioCases,
  pageUrlParamCases,
  pageUrlWithParams,
} from './mock-scenario.utils.data'

describe('pageUrlParam', () => {
  it.each(pageUrlParamCases)('reads $name', ({ param, value }) => {
    openPage(pageUrlWithParams)

    expect(pageUrlParam(param)).toBe(value)
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
    expect((thrown as Response).status).toBe(HttpStatus.InternalServerError)
    expect(await (thrown as Response).json()).toMatchObject({ code: 'internal_error' })
  })

  it.each(handlerScenarioCases)('leaves $name to the handler', async ({ address, scenario }) => {
    openPage(address)

    await expect(answerScenario('me')).resolves.toBe(scenario)
  })

  it('never answers the loading scenario', async () => {
    openPage('/?mock-me=loading')
    await expectStillPending(answerScenario('me'))
  })
})
