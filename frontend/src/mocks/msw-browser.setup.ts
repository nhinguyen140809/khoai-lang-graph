import { setupWorker } from 'msw/browser'

import { streamHandlers } from './runs/run-stream.handlers'
import { handlers } from './runs/runs.handlers'
import { threadHandlers } from './threads/threads.handlers'

export const worker = setupWorker(...handlers, ...threadHandlers, ...streamHandlers)
