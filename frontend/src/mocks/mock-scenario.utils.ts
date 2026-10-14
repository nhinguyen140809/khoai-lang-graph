import { delay } from 'msw'

import { internalError } from './problem.utils'

export type MockScenario = 'default' | 'empty' | 'error' | 'loading'

const SCENARIOS: readonly string[] = ['empty', 'error', 'loading']

/** A parameter of the page address, for scenarios that are not a query state. */
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
  return value !== null && SCENARIOS.includes(value) ? (value as MockScenario) : 'default'
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

/** The state of the run of the API examples: running, waiting for review, failed, or done. */
export type MockRunState = 'running' | 'waiting' | 'failed' | 'done'

const RUN_STATES: readonly string[] = ['running', 'waiting', 'failed', 'done']

/**
 * The state of the mock run that waits at the analysis review by default, chosen in the page URL
 * with `?mock-run-state=running` (or `failed`, `done`). The threads and runs handlers read it.
 */
export function mockRunState(): MockRunState {
  const value = pageParam('mock-run-state')
  return value !== null && RUN_STATES.includes(value) ? (value as MockRunState) : 'waiting'
}
