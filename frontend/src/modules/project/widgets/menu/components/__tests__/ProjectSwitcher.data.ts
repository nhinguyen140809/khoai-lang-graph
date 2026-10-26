import { projectIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'

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
    answer: () => serverErrorOn(HttpMethod.Get, apiEndpoints.project.pattern),
    label: 'Project unavailable',
  },
]
