import { delay, http, HttpResponse } from 'msw'

import { mockScenario } from '../shared/mock-scenario.utils'
import { mockThreads } from './threads.fixtures'

export const threadHandlers = [
  http.get('/api/v1/threads', async () => {
    switch (mockScenario('threads')) {
      case 'empty':
        return HttpResponse.json({ items: [] })
      case 'error':
        return new HttpResponse(null, { status: 500 })
      case 'loading':
        await delay('infinite')
        return HttpResponse.json({ items: mockThreads })
      case 'default':
        return HttpResponse.json({ items: mockThreads })
    }
  }),
]
