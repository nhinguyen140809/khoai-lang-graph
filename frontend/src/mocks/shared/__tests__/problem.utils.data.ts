import { internalError, notFound, unauthenticated, validationFailed } from '../problem.utils'

/** A problem that the handlers share, and the status, code and fields it answers with. */
export const sharedProblemCases = [
  {
    name: 'notFound',
    answer: () => notFound('The user'),
    status: 404,
    fields: { code: 'not_found', detail: 'The user does not exist.' },
  },
  {
    name: 'unauthenticated',
    answer: () => unauthenticated('Sign in.'),
    status: 401,
    fields: { code: 'unauthenticated', detail: 'Sign in.' },
  },
  {
    name: 'validationFailed',
    answer: () => validationFailed([{ field: 'email', message: 'Enter a value.' }]),
    status: 422,
    fields: { code: 'validation_failed', errors: [{ field: 'email', message: 'Enter a value.' }] },
  },
  {
    name: 'internalError',
    answer: () => internalError(),
    status: 500,
    fields: { code: 'internal_error', detail: null },
  },
]
