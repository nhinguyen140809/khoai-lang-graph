import { http, HttpResponse } from 'msw'

import { PROJECT_IDS } from '@/mocks/shared/mock-ids.constants'

/** A project, the answer about it, and what the gate shows once the project is loaded or failed. */
export const gateCases = [
  {
    name: 'the screens of a project that exists',
    projectId: PROJECT_IDS.mentor,
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
    projectId: PROJECT_IDS.mentor,
    answer: () =>
      http.get('/api/v1/projects/:projectId', () => new HttpResponse(null, { status: 500 })),
    shows: 'Project screens, error',
    hides: 'Project not found',
  },
]
