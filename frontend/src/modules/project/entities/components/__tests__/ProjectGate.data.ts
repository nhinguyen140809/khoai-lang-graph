import { http, HttpResponse } from 'msw'

import { projectIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'

/** A project, the answer about it, and what the gate shows once the project is loaded or failed. */
export const gateCases = [
  {
    name: 'the screens of a project that exists',
    projectId: projectIds.mentor,
    answer: null,
    shows: 'Project screens, success',
    hides: 'Project not found',
  },
  {
    name: 'the not found state for a project that does not exist',
    projectId: 'missing',
    answer: null,
    shows: 'Project not found',
    hides: /Project screens/,
  },
  {
    name: 'the screens when the project fails to load for another reason',
    projectId: projectIds.mentor,
    answer: () =>
      http.get(apiEndpoints.project.pattern, () => new HttpResponse(null, { status: 500 })),
    shows: 'Project screens, error',
    hides: 'Project not found',
  },
]
