import { setupWorker } from 'msw/browser'

import { accountHandlers } from './account/account.handlers'
import { authHandlers } from './account/auth.handlers'
import { meHandlers } from './account/me.handlers'
import { artifactKindHandlers } from './artifacts/artifact-kinds.handlers'
import { artifactHandlers } from './artifacts/artifacts.handlers'
import { modelHandlers } from './models/models.handlers'
import { projectHandlers } from './projects/projects.handlers'
import { interruptHandlers } from './runs/interrupts.handlers'
import { streamHandlers } from './runs/run-stream.handlers'
import { runHandlers } from './runs/runs.handlers'
import { keepMockDataInBrowser, resetMockData } from './shared/mock-db.utils'
import { pageParam } from './shared/mock-scenario.utils'
import { messageHandlers } from './threads/messages.handlers'
import { threadHandlers } from './threads/threads.handlers'
import { traceabilityHandlers } from './traceability/traceability.handlers'
import { workflowStateHandlers } from './workflow/workflow-state.handlers'

// The records of the mock server survive a reload; `?mock-reset` starts again from the fixtures.
keepMockDataInBrowser()
if (pageParam('mock-reset') !== null) resetMockData()

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
  ...workflowStateHandlers,
  ...streamHandlers,
)
