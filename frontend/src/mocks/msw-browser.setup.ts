import { setupWorker } from 'msw/browser'

import { accountHandlers } from './account.handlers'
import { artifactKindHandlers } from './artifact-kinds.handlers'
import { artifactHandlers } from './artifacts.handlers'
import { authHandlers } from './auth.handlers'
import { interruptHandlers } from './interrupts.handlers'
import { meHandlers } from './me.handlers'
import { messageHandlers } from './messages.handlers'
import { keepMockDataInBrowser, resetMockData } from './mock-db.utils'
import { modelHandlers } from './models.handlers'
import { projectHandlers } from './projects.handlers'
import { streamHandlers } from './run-stream.handlers'
import { runHandlers } from './runs.handlers'
import { threadHandlers } from './threads.handlers'
import { traceabilityHandlers } from './traceability.handlers'

// The records of the mock server survive a reload; `?mock-reset` starts again from the fixtures.
keepMockDataInBrowser()
if (new URLSearchParams(window.location.search).has('mock-reset')) resetMockData()

export const worker = setupWorker(
  ...authHandlers,
  ...artifactKindHandlers,
  ...meHandlers,
  ...accountHandlers,
  ...modelHandlers,
  ...projectHandlers,
  ...artifactHandlers,
  ...traceabilityHandlers,
  ...interruptHandlers,
  ...threadHandlers,
  ...messageHandlers,
  ...runHandlers,
  ...streamHandlers,
)
