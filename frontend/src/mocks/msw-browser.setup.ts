import { setupWorker } from 'msw/browser'

import { artifactKindHandlers } from './artifact-kinds.handlers'
import { artifactHandlers } from './artifacts.handlers'
import { authHandlers } from './auth.handlers'
import { itemHandlers } from './items.handlers'
import { linkHandlers } from './links.handlers'
import { meHandlers } from './me.handlers'
import { keepMockDataInBrowser, resetMockData } from './mock-db.utils'
import { projectHandlers } from './projects.handlers'
import { streamHandlers } from './run-stream.handlers'
import { runHandlers } from './runs.handlers'
import { threadHandlers } from './threads.handlers'

// The records of the mock server survive a reload; `?mock-reset` starts again from the fixtures.
keepMockDataInBrowser()
if (new URLSearchParams(window.location.search).has('mock-reset')) resetMockData()

export const worker = setupWorker(
  ...authHandlers,
  ...artifactKindHandlers,
  ...artifactHandlers,
  ...linkHandlers,
  ...meHandlers,
  ...projectHandlers,
  ...itemHandlers,
  ...threadHandlers,
  ...runHandlers,
  ...streamHandlers,
)
