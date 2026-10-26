import { http, HttpResponse } from 'msw'

import { projectIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'

/** The open project, the answer about it, and what the button on the top bar says. */
export const switcherLabelCases = [
  {
    name: 'the name of the project',
    projectId: projectIds.mentor,
    answer: null,
    label: 'Mentor platform',
  },
  {
    name: 'a project that does not exist',
    projectId: 'missing',
    answer: null,
    label: 'Project not found',
  },
  {
    name: 'a project that fails to load',
    projectId: projectIds.mentor,
    answer: () =>
      http.get(apiEndpoints.project.pattern, () => new HttpResponse(null, { status: 500 })),
    label: 'Project unavailable',
  },
]
