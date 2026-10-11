import { setupServer } from 'msw/node'

import { artifactKindHandlers } from './artifact-kinds.handlers'
import { artifactHandlers } from './artifacts.handlers'
import { authHandlers } from './auth.handlers'
import { interruptHandlers } from './interrupts.handlers'
import { meHandlers } from './me.handlers'
import { messageHandlers } from './messages.handlers'
import { projectHandlers } from './projects.handlers'
import { runHandlers } from './runs.handlers'
import { threadHandlers } from './threads.handlers'
import { traceabilityHandlers } from './traceability.handlers'

export const server = setupServer(
  ...authHandlers,
  ...artifactKindHandlers,
  ...meHandlers,
  ...projectHandlers,
  ...artifactHandlers,
  ...traceabilityHandlers,
  ...interruptHandlers,
  ...threadHandlers,
  ...messageHandlers,
  ...runHandlers,
)
