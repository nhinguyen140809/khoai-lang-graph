import { authHandlers } from './account/auth.handlers'
import { meHandlers } from './account/me.handlers'
import { artifactHandlers } from './artifacts/handlers/artifacts.handlers'
import { itemEditHandlers } from './artifacts/handlers/item-edits.handlers'
import { itemHandlers } from './artifacts/handlers/items.handlers'
import { exportHandlers } from './exports/exports.handlers'
import { interruptHandlers } from './interrupts/interrupts.handlers'
import { messageHandlers } from './messages/messages.handlers'
import { projectHandlers } from './projects/projects.handlers'
import { directiveHandlers } from './runs/handlers/directives.handlers'
import { runStateHandlers } from './runs/handlers/run-state.handlers'
import { runHandlers } from './runs/handlers/runs.handlers'
import { threadHandlers } from './threads/threads.handlers'
import { chainHandlers } from './trace/handlers/chains.handlers'
import { traceLinkHandlers } from './trace/handlers/trace-links.handlers'
import { traceabilityHandlers } from './trace/handlers/traceability.handlers'
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
  ...artifactHandlers,
  ...itemHandlers,
  ...itemEditHandlers,
  ...exportHandlers,
  ...traceLinkHandlers,
  ...chainHandlers,
  ...traceabilityHandlers,
  ...threadHandlers,
  ...messageHandlers,
  ...runHandlers,
  ...runStateHandlers,
  ...directiveHandlers,
  ...interruptHandlers,
]
