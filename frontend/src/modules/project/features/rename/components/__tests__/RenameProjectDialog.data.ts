import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'

/** A name typed in the dialog, the answer of the API if it is sent, and the problem that shows. */
export const renameProblemCases = [
  { name: 'a blank name', typed: '   ', answer: null, problem: 'Enter a name.' },
  {
    name: 'a name that the API does not take',
    typed: 'Mentor finder',
    answer: () =>
      http.patch(apiEndpoints.project.pattern, () =>
        HttpResponse.json(
          {
            title: 'Validation failed',
            status: HttpStatus.UnprocessableContent,
            code: 'validation_failed',
            errors: [{ field: 'name', message: 'Choose another name.' }],
          },
          { status: HttpStatus.UnprocessableContent },
        ),
      ),
    problem: 'Choose another name.',
  },
  {
    name: 'a failure of the API',
    typed: 'Mentor finder',
    answer: () => serverErrorOn(HttpMethod.Patch, apiEndpoints.project.pattern),
    problem: 'Failed to rename the project (HTTP 500)',
  },
]
