import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

const path = apiEndpoints.userSettings.path()

/** The requests about the settings that the mock refuses. */
export const settingsRejectedCases: RejectedRequestCase[] = [
  {
    name: 'answers 422 to PUT with a theme out of the list',
    method: 'PUT',
    path,
    body: { theme: 'neon' },
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field: 'theme', message: 'Choose one of the values.' }] },
  },
  {
    name: 'answers 422 to PUT with run settings of the wrong type',
    method: 'PUT',
    path,
    body: { default_run_config: { max_steps: 'many' } },
    status: HttpStatus.UnprocessableContent,
    answer: {
      errors: [
        { field: 'default_run_config.max_steps', message: 'Send a value of type integer or null.' },
      ],
    },
  },
  {
    name: 'answers 422 to PUT with a field that is not allowed',
    method: 'PUT',
    path,
    body: { user_id: 'someone-else' },
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field: 'user_id', message: 'This field is not allowed.' }] },
  },
  {
    name: 'answers 500 to GET in the error scenario',
    method: 'GET',
    path,
    page: '/?mock-user-settings=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
  {
    name: 'answers 500 to PUT in the error scenario',
    method: 'PUT',
    path,
    body: {},
    page: '/?mock-replace-user-settings=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
]
