import { setupServer } from 'msw/node'

import { accountHandlers } from './account/account.handlers'
import { authHandlers } from './account/auth.handlers'
import { meHandlers } from './account/me.handlers'
import { artifactKindHandlers } from './artifacts/artifact-kinds.handlers'
import { artifactHandlers } from './artifacts/artifacts.handlers'
import { modelHandlers } from './models/models.handlers'
import { projectHandlers } from './projects/projects.handlers'
import { interruptHandlers } from './runs/interrupts.handlers'
import { runHandlers } from './runs/runs.handlers'
import { messageHandlers } from './threads/messages.handlers'
import { threadHandlers } from './threads/threads.handlers'
import { traceabilityHandlers } from './traceability/traceability.handlers'
import { workflowStateHandlers } from './workflow/workflow-state.handlers'

export const server = setupServer(
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
)
