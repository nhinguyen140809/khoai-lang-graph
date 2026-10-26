import { setupWorker } from 'msw/browser'

import { apiHandlers } from './api.setup'
import { streamHandlers } from './runs/handlers/run-stream.handlers'
import { keepMockDataInBrowser, resetMockData } from './shared/db/mock-state.utils'
import { addressParam } from './shared/scenario/mock-scenario.utils'

// The records of the mock server survive a reload; `?mock-reset` starts again from the fixtures.
keepMockDataInBrowser()
if (addressParam('mock-reset') !== null) resetMockData()

// The event stream of a run exists in the browser only: the unit tests have no EventSource.
export const worker = setupWorker(...apiHandlers, ...streamHandlers)
