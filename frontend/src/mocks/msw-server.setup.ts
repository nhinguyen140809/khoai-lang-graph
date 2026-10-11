import { setupServer } from 'msw/node'

import { artifactKindHandlers } from './artifact-kinds.handlers'
import { artifactHandlers } from './artifacts.handlers'
import { authHandlers } from './auth.handlers'
import { itemHandlers } from './items.handlers'
import { linkHandlers } from './links.handlers'
import { meHandlers } from './me.handlers'
import { projectHandlers } from './projects.handlers'
import { runHandlers } from './runs.handlers'
import { threadHandlers } from './threads.handlers'

export const server = setupServer(
  ...authHandlers,
  ...artifactKindHandlers,
  ...artifactHandlers,
  ...linkHandlers,
  ...meHandlers,
  ...projectHandlers,
  ...itemHandlers,
  ...threadHandlers,
  ...runHandlers,
)
