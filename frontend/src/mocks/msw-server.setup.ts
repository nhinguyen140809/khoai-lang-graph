import { setupServer } from 'msw/node'

import { authHandlers } from './account/auth.handlers'
import { meHandlers } from './account/me.handlers'
import { messageHandlers } from './messages/messages.handlers'
import { projectHandlers } from './projects/projects.handlers'
import { runHandlers } from './runs/runs.handlers'
import { threadHandlers } from './threads/threads.handlers'
import { workflowHandlers } from './workflow/workflow.handlers'

export const server = setupServer(
  ...authHandlers,
  ...meHandlers,
  ...projectHandlers,
  ...threadHandlers,
  ...messageHandlers,
  ...runHandlers,
  ...workflowHandlers,
)
