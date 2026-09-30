import { setupServer } from 'msw/node'

import { handlers } from './runs.handlers'

export const server = setupServer(...handlers)
