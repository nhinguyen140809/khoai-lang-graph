import { setupWorker } from 'msw/browser'

import { streamHandlers } from './run-stream.handlers'
import { handlers } from './runs.handlers'
import { threadHandlers } from './threads.handlers'

export const worker = setupWorker(...handlers, ...threadHandlers, ...streamHandlers)
