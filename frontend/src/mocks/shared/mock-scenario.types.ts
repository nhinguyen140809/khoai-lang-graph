/** The scenarios that the page URL can choose for a mocked resource. */
export const mockScenarios = ['empty', 'error', 'loading'] as const

/** What a mocked resource answers: its fixtures by default, or a scenario of the page URL. */
export type MockScenario = 'default' | (typeof mockScenarios)[number]

/** The scenarios that each handler answers itself. */
export type HandlerScenario = Exclude<MockScenario, 'error' | 'loading'>

/** The states that the page URL can choose for the run of the API examples. */
export const mockRunStates = ['running', 'waiting', 'failed', 'done'] as const

/** The state of the run of the API examples: running, waiting for review, failed, or done. */
export type MockRunState = (typeof mockRunStates)[number]
