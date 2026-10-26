import { act } from '@testing-library/react'
import { describe } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { buildProject } from '@/mocks/projects/projects.fixtures'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import { renderHookWithProviders } from '@/test/render'
import { itToastsOnResult } from '@/test/suites'

import { useDeleteProject } from '../useDeleteProject'
import { campusProject } from './useDeleteProject.data'

/** Renders the hook and deletes the project of the cases. */
function startDeleting() {
  const { result } = renderHookWithProviders(() => useDeleteProject())
  act(() => {
    result.current.mutate(buildProject(campusProject))
  })
}

describe('useDeleteProject', () => {
  itToastsOnResult([
    {
      name: 'a project deleted, which names the project',
      start: startDeleting,
      kind: 'success',
      message: 'Project deleted',
      options: { description: campusProject.name },
    },
    {
      name: 'a failed delete, in the words of the error',
      start: startDeleting,
      refuse: () => {
        server.use(serverErrorOn(HttpMethod.Delete, apiEndpoints.project.pattern))
      },
      kind: 'error',
      message: 'Failed to delete the project (HTTP 500)',
    },
  ])
})
