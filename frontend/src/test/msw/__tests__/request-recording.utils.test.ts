import { describe, expect, it, vi } from 'vitest'

import { apiEndpoints } from '@/shared/api/endpoints'

import { fetchApi, patchApi, postApi } from '../msw-calls.utils'
import { recordRequests } from '../request-recording.utils'

describe('recordRequests', () => {
  it('lists the requests in the order they were sent, each with its body', async () => {
    const requests = recordRequests()
    const projects = apiEndpoints.projects.path()
    const project = apiEndpoints.project.path({ projectId: 'p1' })

    await Promise.all([
      postApi(projects, { name: 'First' }),
      patchApi(project, { name: 'Second' }),
      fetchApi(projects),
    ])

    await vi.waitFor(() => {
      expect(requests).toEqual([
        { method: 'POST', path: projects, body: { name: 'First' } },
        { method: 'PATCH', path: project, body: { name: 'Second' } },
        { method: 'GET', path: projects, body: null },
      ])
    })
  })
})
