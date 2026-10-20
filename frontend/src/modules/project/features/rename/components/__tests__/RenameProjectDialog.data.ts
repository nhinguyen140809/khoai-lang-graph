import { http, HttpResponse } from 'msw'

/** A name typed in the dialog, the answer of the API if it is sent, and the problem that shows. */
export const renameProblemCases = [
  { name: 'a blank name', typed: '   ', answer: null, problem: 'Enter a name.' },
  {
    name: 'a name that the API does not take',
    typed: 'Mentor finder',
    answer: () =>
      http.patch('/api/v1/projects/:projectId', () =>
        HttpResponse.json(
          {
            title: 'Validation failed',
            status: 422,
            code: 'validation_failed',
            errors: [{ field: 'name', message: 'Choose another name.' }],
          },
          { status: 422 },
        ),
      ),
    problem: 'Choose another name.',
  },
  {
    name: 'a failure of the API',
    typed: 'Mentor finder',
    answer: () =>
      http.patch('/api/v1/projects/:projectId', () => new HttpResponse(null, { status: 500 })),
    problem: 'Failed to rename the project (HTTP 500)',
  },
]
