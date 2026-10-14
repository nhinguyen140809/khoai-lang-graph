export type MockScenario = 'default' | 'empty' | 'error' | 'loading'

const SCENARIOS: readonly string[] = ['empty', 'error', 'loading']

/**
 * Scenario for one mocked resource, chosen in the page URL: `?mock-threads=error` makes the
 * threads handlers answer with an error. Without the parameter, handlers return their fixtures.
 */
export function mockScenario(resource: string): MockScenario {
  if (typeof window === 'undefined') return 'default'
  const value = new URLSearchParams(window.location.search).get(`mock-${resource}`)
  return value !== null && SCENARIOS.includes(value) ? (value as MockScenario) : 'default'
}
