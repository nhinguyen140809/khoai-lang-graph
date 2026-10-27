import { authHandlers } from './account/auth.handlers'
import { meHandlers } from './account/me.handlers'
import { messageHandlers } from './messages/messages.handlers'
import { projectHandlers } from './projects/projects.handlers'
import { runHandlers } from './runs/handlers/runs.handlers'
import { threadHandlers } from './threads/threads.handlers'
import { artifactKindHandlers } from './workflow/artifact-kinds.handlers'
import { workflowHandlers } from './workflow/workflow.handlers'

/**
 * The handlers of every endpoint of the API that both the worker of the browser and the server of
 * the unit tests answer. A resource is added here once.
 */
export const apiHandlers = [
  ...authHandlers,
  ...meHandlers,
  ...projectHandlers,
  ...workflowHandlers,
  ...artifactKindHandlers,
  ...threadHandlers,
  ...messageHandlers,
  ...runHandlers,
]
