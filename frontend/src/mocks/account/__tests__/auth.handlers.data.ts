const enterValue = (field: string) => ({ field, message: 'Enter a value.' })

/** A request in the scenario of the page address, with its body as text, and the problem it answers. */
export const authProblemCases = [
  {
    request: 'POST /auth/login without the fields',
    address: '/',
    path: '/api/v1/auth/login',
    body: '{"email": ""}',
    status: 422,
    problem: { errors: [enterValue('email'), enterValue('password')] },
  },
  {
    request: 'POST /auth/login with a body that is not JSON',
    address: '/',
    path: '/api/v1/auth/login',
    body: 'not json',
    status: 422,
    problem: { errors: [enterValue('email'), enterValue('password')] },
  },
  {
    request: 'POST /auth/register without the fields',
    address: '/',
    path: '/api/v1/auth/register',
    body: '{"email": " ", "display_name": 3}',
    status: 422,
    problem: { errors: [enterValue('email'), enterValue('password'), enterValue('display_name')] },
  },
  {
    request: 'POST /auth/register with a body that is not JSON',
    address: '/',
    path: '/api/v1/auth/register',
    body: 'not json',
    status: 422,
    problem: { errors: [enterValue('email'), enterValue('password'), enterValue('display_name')] },
  },
  {
    request: 'POST /auth/login in the error scenario',
    address: '/login?mock-login=error',
    path: '/api/v1/auth/login',
    body: '{"email": "a@example.com", "password": "x"}',
    status: 401,
    problem: { code: 'unauthenticated', detail: 'The email or the password is wrong.' },
  },
  {
    request: 'POST /auth/register in the error scenario',
    address: '/register?mock-register=error',
    path: '/api/v1/auth/register',
    body: '{"email": "a@example.com", "password": "x", "display_name": "A"}',
    status: 422,
    problem: { errors: [{ field: 'email', message: 'An account with this email exists.' }] },
  },
]
