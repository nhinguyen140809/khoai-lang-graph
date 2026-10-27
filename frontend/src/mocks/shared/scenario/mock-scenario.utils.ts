import { isOneOf } from '@/shared/lib/guards'

import { internalError } from '../http/response'
import {
  type HandlerScenario,
  type MockRunState,
  mockRunStates,
  type MockScenario,
  mockScenarios,
} from './mock-scenario.types'

/** A parameter of the page address; null outside the browser, such as in unit tests. */
export function pageUrlParam(name: string): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(name)
}

/**
 * Scenario for one mocked resource, chosen in the page URL: `?mock-threads=error` makes the
 * threads handlers answer with an error. Without the parameter, handlers return their fixtures.
 * For an endpoint that returns one record, `empty` answers 404.
 */
export function mockScenario(resource: string): MockScenario {
  const value = pageUrlParam(`mock-${resource}`)
  return isOneOf(mockScenarios, value) ? value : 'default'
}

/** An answer that never comes, so that the request never ends, as in a `loading` scenario. */
export function pendingForever(): Promise<never> {
  return new Promise<never>(() => undefined)
}

/**
 * Answers the `error` and `loading` scenarios of `resource`, which every handler answers the same
 * way: it throws HTTP 500, which MSW sends as the response, or never settles, so that the request
 * never ends. Returns the scenario that the handler answers itself.
 */
export async function answerScenario(resource: string): Promise<HandlerScenario> {
  const scenario = mockScenario(resource)
  if (scenario === 'error') {
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- MSW answers a thrown Response
    throw internalError()
  }
  if (scenario === 'loading') return pendingForever()
  return scenario
}

/**
 * The state of the mock run that waits at the analysis review by default, chosen in the page URL
 * with `?mock-run-state=running` (or `failed`, `done`). The threads and runs handlers read it.
 */
export function mockRunState(): MockRunState {
  const value = pageUrlParam('mock-run-state')
  return isOneOf(mockRunStates, value) ? value : 'waiting'
}
