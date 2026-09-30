import { setupWorker } from 'msw/browser'

import { streamHandlers } from './run-stream.handlers'
import { handlers } from './runs.handlers'

export const worker = setupWorker(...handlers, ...streamHandlers)
