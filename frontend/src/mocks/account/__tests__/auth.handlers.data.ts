import { apiEndpoints } from '@/shared/api/endpoints'

const enterValue = (field: string) => ({ field, message: 'Enter a value.' })

/** A request that never answers in the loading scenario of the page address. */
export const authLoadingCases = [
  { request: 'POST /auth/login', address: '/?mock-login=loading', path: apiEndpoints.login.path() },
  {
    request: 'POST /auth/register',
    address: '/?mock-register=loading',
    path: apiEndpoints.register.path(),
  },
]

/** A request in the scenario of the page address, with its body as text, and the problem it answers. */
export const authProblemCases = [
  {
    request: 'POST /auth/login without the fields',
    address: '/',
    path: apiEndpoints.login.path(),
    body: '{"email": ""}',
    status: 422,
    problem: { errors: [enterValue('email'), enterValue('password')] },
  },
  {
    request: 'POST /auth/login with a body that is not JSON',
    address: '/',
    path: apiEndpoints.login.path(),
    body: 'not json',
    status: 422,
    problem: { errors: [enterValue('email'), enterValue('password')] },
  },
  {
    request: 'POST /auth/register without the fields',
    address: '/',
    path: apiEndpoints.register.path(),
    body: '{"email": " ", "display_name": 3}',
    status: 422,
    problem: { errors: [enterValue('email'), enterValue('password'), enterValue('display_name')] },
  },
  {
    request: 'POST /auth/register with a body that is not JSON',
    address: '/',
    path: apiEndpoints.register.path(),
    body: 'not json',
    status: 422,
    problem: { errors: [enterValue('email'), enterValue('password'), enterValue('display_name')] },
  },
  {
    request: 'POST /auth/login in the error scenario',
    address: '/login?mock-login=error',
    path: apiEndpoints.login.path(),
    body: '{"email": "a@example.com", "password": "x"}',
    status: 401,
    problem: { code: 'unauthenticated', detail: 'The email or the password is wrong.' },
  },
  {
    request: 'POST /auth/register in the error scenario',
    address: '/register?mock-register=error',
    path: apiEndpoints.register.path(),
    body: '{"email": "a@example.com", "password": "x", "display_name": "A"}',
    status: 422,
    problem: { errors: [{ field: 'email', message: 'An account with this email exists.' }] },
  },
]
