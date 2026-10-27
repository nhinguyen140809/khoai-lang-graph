import { setupWorker } from 'msw/browser'

import { apiHandlers } from './api.setup'
import { streamHandlers } from './runs/handlers/run-stream.handlers'
import { keepMockDataInBrowser, resetMockData } from './shared/db'
import { pageUrlParam } from './shared/scenario'

// The records of the mock server survive a reload; `?mock-reset` starts again from the fixtures.
keepMockDataInBrowser()
if (pageUrlParam('mock-reset') !== null) resetMockData()

// The event stream of a run exists in the browser only: the unit tests have no EventSource.
export const mswWorker = setupWorker(...apiHandlers, ...streamHandlers)
