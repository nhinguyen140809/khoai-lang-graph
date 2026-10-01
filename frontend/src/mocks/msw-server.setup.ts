import { setupServer } from 'msw/node'

import { handlers } from './runs.handlers'
import { threadHandlers } from './threads.handlers'

export const server = setupServer(...handlers, ...threadHandlers)
