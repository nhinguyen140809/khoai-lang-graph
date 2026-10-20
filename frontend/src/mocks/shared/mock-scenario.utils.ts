import { internalError } from './problem.utils'

const mockScenarios = ['empty', 'error', 'loading'] as const

/** What a mocked resource answers: its fixtures by default, or a scenario of the page URL. */
export type MockScenario = 'default' | (typeof mockScenarios)[number]

/** The scenarios that each handler answers itself. */
export type HandlerScenario = Exclude<MockScenario, 'error' | 'loading'>

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

/** An answer that never comes, so that the request never ends, as in a `loading` scenario. */
export function neverAnswer(): Promise<never> {
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
  if (scenario === 'loading') return neverAnswer()
  return scenario
}

const mockRunStates = ['queued', 'running', 'waiting', 'failed', 'done'] as const

/**
 * The state of the run of the API examples: about to start, running, waiting for review, failed,
 * or done.
 */
export type MockRunState = (typeof mockRunStates)[number]

function isMockRunState(value: string): value is MockRunState {
  return (mockRunStates as readonly string[]).includes(value)
}

/**
 * The state of the mock run that waits at the analysis review by default, chosen in the page URL
 * with `?mock-run-state=running` (or `queued`, `failed`, `done`). The threads and runs handlers
 * read it.
 */
export function mockRunState(): MockRunState {
  const value = pageParam('mock-run-state')
  return value !== null && isMockRunState(value) ? value : 'waiting'
}
