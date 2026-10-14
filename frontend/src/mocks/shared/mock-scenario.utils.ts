import { delay } from 'msw'

import { internalError } from './problem.utils'

const mockScenarios = ['empty', 'error', 'loading'] as const

/** What a mocked resource answers: its fixtures by default, or a scenario of the page URL. */
export type MockScenario = 'default' | (typeof mockScenarios)[number]

function isMockScenario(value: string): value is (typeof mockScenarios)[number] {
  return (mockScenarios as readonly string[]).includes(value)
}

/** A parameter of the page address; null outside the browser, such as in unit tests. */
export function pageParam(name: string): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(name)
}

/**
 * Scenario for one mocked resource, chosen in the page URL: `?mock-threads=error` makes the
 * threads handlers answer with an error. Without the parameter, handlers return their fixtures.
 * For an endpoint that returns one record, `empty` answers 404.
 */
export function mockScenario(resource: string): MockScenario {
  const value = pageParam(`mock-${resource}`)
  return value !== null && isMockScenario(value) ? value : 'default'
}

/**
 * Answers the `error` and `loading` scenarios, which every handler answers the same way: HTTP 500,
 * or a request that never ends. Returns null for the scenarios each handler answers itself.
 */
export async function answerScenario(scenario: MockScenario): Promise<Response | null> {
  if (scenario === 'error') return internalError()
  if (scenario === 'loading') await delay('infinite')
  return null
}
