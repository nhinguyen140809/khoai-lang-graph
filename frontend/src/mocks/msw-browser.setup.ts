import { setupWorker } from 'msw/browser'

import { authHandlers } from './account/auth.handlers'
import { meHandlers } from './account/me.handlers'
import { messageHandlers } from './messages/messages.handlers'
import { projectHandlers } from './projects/projects.handlers'
import { streamHandlers } from './runs/handlers/run-stream.handlers'
import { runHandlers } from './runs/handlers/runs.handlers'
import { keepMockDataInBrowser, resetMockData } from './shared/db/mock-state.utils'
import { addressParam } from './shared/scenario/mock-scenario.utils'
import { threadHandlers } from './threads/threads.handlers'

// The records of the mock server survive a reload; `?mock-reset` starts again from the fixtures.
keepMockDataInBrowser()
if (addressParam('mock-reset') !== null) resetMockData()

export const worker = setupWorker(
  ...authHandlers,
  ...meHandlers,
  ...projectHandlers,
  ...threadHandlers,
  ...messageHandlers,
  ...runHandlers,
  ...streamHandlers,
)
