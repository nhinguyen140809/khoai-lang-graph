import type { HttpHandler } from 'msw'

/** A state of the query behind a screen, and what the screen shows in it. */
export interface QueryStateCase {
  name: string
  /** The answer of the server that brings the state; null for the answer of the mock data. */
  answer: (() => HttpHandler) | null
  /** What the screen shows once the query has settled. */
  shows: string | RegExp
  /** What the screen does not show in that state. */
  hides?: string | RegExp
}

/** A screen with the states of its query, as `itShowsQueryStates` needs to know it. */
export interface QueryStatesSuite<Case extends QueryStateCase> {
  /** Renders the screen for a case, which may hold more than a state, such as the id it loads. */
  renderScreen: (state: Case) => void
  cases: readonly Case[]
}
