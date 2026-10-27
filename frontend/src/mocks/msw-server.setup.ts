import { setupServer } from 'msw/node'

import { apiHandlers } from './api.setup'

export const server = setupServer(...apiHandlers)
