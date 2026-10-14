import { setupServer } from 'msw/node'

import { handlers } from './runs/runs.handlers'
import { threadHandlers } from './threads/threads.handlers'

export const server = setupServer(...handlers, ...threadHandlers)
