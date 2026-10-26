import { projectIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import type { QueryStateCase } from '@/test/suites'

/** A project, the answer about it, and what the gate shows once the project is loaded or failed. */
export const gateCases: (QueryStateCase & { projectId: string })[] = [
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
    answer: () => serverErrorOn(HttpMethod.Get, apiEndpoints.project.pattern),
    shows: 'Project screens, error',
    hides: 'Project not found',
  },
]
