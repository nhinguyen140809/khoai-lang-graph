import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { MOCK_RUN_ID } from '@/mocks/runs.handlers'

import { createRun } from './chat.api'

describe('createRun', () => {
  it('returns the run id from the API', async () => {
    await expect(createRun('thread-1', 'hi')).resolves.toEqual({ run_id: MOCK_RUN_ID })
  })

  it('throws on an HTTP error', async () => {
    server.use(
      http.post('/api/v1/threads/:threadId/runs', () => new HttpResponse(null, { status: 409 })),
    )

    await expect(createRun('thread-1', 'hi')).rejects.toThrow('HTTP 409')
  })
})
