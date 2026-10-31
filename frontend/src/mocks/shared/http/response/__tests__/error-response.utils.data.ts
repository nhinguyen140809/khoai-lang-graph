import { HttpStatus } from '@/shared/api/http'

import {
  internalError,
  invalidRequest,
  invalidState,
  notFound,
  unauthenticated,
  validationFailed,
  versionConflict,
} from '../error-response.utils'

/** A problem that the handlers share, and the status, code and fields it answers with. */
export const errorResponseCases = [
  {
    name: 'notFound',
    answer: () => notFound('The user'),
    status: HttpStatus.NotFound,
    fields: { code: 'not_found', detail: 'The user does not exist.' },
  },
  {
    name: 'unauthenticated',
    answer: () => unauthenticated('Log in.'),
    status: HttpStatus.Unauthorized,
    fields: { code: 'unauthenticated', detail: 'Log in.' },
  },
  {
    name: 'validationFailed',
    answer: () => validationFailed([{ field: 'email', message: 'Enter a value.' }]),
    status: HttpStatus.UnprocessableContent,
    fields: { code: 'validation_failed', errors: [{ field: 'email', message: 'Enter a value.' }] },
  },
  {
    name: 'invalidRequest',
    answer: () => invalidRequest('Send the month as YYYY-MM.'),
    status: HttpStatus.BadRequest,
    fields: { code: 'invalid_request', detail: 'Send the month as YYYY-MM.' },
  },
  {
    name: 'invalidState',
    answer: () => invalidState('The run has ended.'),
    status: HttpStatus.Conflict,
    fields: { code: 'invalid_state', detail: 'The run has ended.' },
  },
  {
    name: 'versionConflict',
    answer: () => versionConflict('The item is at version 3.'),
    status: HttpStatus.Conflict,
    fields: { code: 'version_conflict', detail: 'The item is at version 3.' },
  },
  {
    name: 'internalError',
    answer: () => internalError(),
    status: HttpStatus.InternalServerError,
    fields: { code: 'internal_error', detail: null },
  },
]
