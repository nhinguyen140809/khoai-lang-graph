import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { PROJECT_IDS } from '@/mocks/shared/mock-ids.constants'

import { listProjectThreads } from '../threads.api'
import { failedListCases, readCases } from './threads.api.data'

describe('the threads API', () => {
  it.each(readCases)('reads $name', async ({ read, expected }) => {
    await expect(read()).resolves.toEqual(expected)
  })

  it.each(failedListCases)('throws on $name', async ({ answer, error }) => {
    server.use(http.get('/api/v1/projects/:projectId/threads', answer))

    await expect(listProjectThreads(PROJECT_IDS.mentor)).rejects.toThrow(error)
  })
})
