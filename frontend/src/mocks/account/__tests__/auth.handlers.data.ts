import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

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

/** The requests that the mock refuses, in the scenario of the page address, and the answers. */
export const authRejectedCases: RejectedRequestCase[] = [
  {
    name: 'answers 422 to POST /auth/login without the fields',
    method: 'POST',
    path: apiEndpoints.login.path(),
    body: '{"email": ""}',
    page: '/',
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [enterValue('email'), enterValue('password')] },
  },
  {
    name: 'answers 422 to POST /auth/login with a body that is not JSON',
    method: 'POST',
    path: apiEndpoints.login.path(),
    body: 'not json',
    page: '/',
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [enterValue('email'), enterValue('password')] },
  },
  {
    name: 'answers 422 to POST /auth/register without the fields',
    method: 'POST',
    path: apiEndpoints.register.path(),
    body: '{"email": " ", "display_name": 3}',
    page: '/',
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [enterValue('email'), enterValue('password'), enterValue('display_name')] },
  },
  {
    name: 'answers 422 to POST /auth/register with a body that is not JSON',
    method: 'POST',
    path: apiEndpoints.register.path(),
    body: 'not json',
    page: '/',
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [enterValue('email'), enterValue('password'), enterValue('display_name')] },
  },
  {
    name: 'answers 401 to POST /auth/login in the error scenario',
    method: 'POST',
    path: apiEndpoints.login.path(),
    body: '{"email": "a@example.com", "password": "x"}',
    page: '/login?mock-login=error',
    status: HttpStatus.Unauthorized,
    answer: { code: 'unauthenticated', detail: 'The email or the password is wrong.' },
  },
  {
    name: 'answers 422 to POST /auth/register in the error scenario',
    method: 'POST',
    path: apiEndpoints.register.path(),
    body: '{"email": "a@example.com", "password": "x", "display_name": "A"}',
    page: '/register?mock-register=error',
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field: 'email', message: 'An account with this email exists.' }] },
  },
]
