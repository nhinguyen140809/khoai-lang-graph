import { http, HttpResponse } from 'msw'

import { mockThreads } from './threads.fixtures'

export const threadHandlers = [
  http.get('/api/v1/threads', () => HttpResponse.json({ items: mockThreads })),
]
