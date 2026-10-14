import { setupWorker } from 'msw/browser'

import { authHandlers } from './account/auth.handlers'
import { meHandlers } from './account/me.handlers'
import { streamHandlers } from './runs/run-stream.handlers'
import { handlers } from './runs/runs.handlers'
import { keepMockDataInBrowser, resetMockData } from './shared/mock-db.utils'
import { pageParam } from './shared/mock-scenario.utils'
import { threadHandlers } from './threads/threads.handlers'

// The records of the mock server survive a reload; `?mock-reset` starts again from the fixtures.
keepMockDataInBrowser()
if (pageParam('mock-reset') !== null) resetMockData()

export const worker = setupWorker(
  ...authHandlers,
  ...meHandlers,
  ...handlers,
  ...threadHandlers,
  ...streamHandlers,
)
