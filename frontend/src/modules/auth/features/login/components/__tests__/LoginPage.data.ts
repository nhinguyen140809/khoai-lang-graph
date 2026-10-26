import { HttpResponse } from 'msw'

/** The page to return to, and the page that opens after logging in. */
export const returnCases = [
  { next: '/projects/p1/console', opens: '/projects/p1/console' },
  { next: 'https://example.com', opens: '/' },
  { next: '/register', opens: '/' },
  { next: null, opens: '/' },
]

/** An answer of POST /auth/login that refuses, and the message under the form. */
export const refusedLoginCases = [
  {
    name: 'a wrong email or password',
    answer: () => HttpResponse.json({ status: 401, code: 'unauthenticated' }, { status: 401 }),
    alert: 'The email or the password is wrong.',
  },
  {
    name: 'too many attempts',
    answer: () => HttpResponse.json({ status: 429, code: 'rate_limited' }, { status: 429 }),
    alert: 'Too many attempts. Wait a moment, then try again.',
  },
  {
    name: 'another 429, with its own message',
    answer: () =>
      HttpResponse.json(
        { status: 429, code: 'budget_exceeded', detail: 'The monthly budget is reached.' },
        { status: 429 },
      ),
    alert: 'Failed to sign in (HTTP 429): The monthly budget is reached.',
  },
  {
    name: 'another failure, with its message',
    answer: () =>
      HttpResponse.json({ status: 503, detail: 'Down for maintenance.' }, { status: 503 }),
    alert: 'Failed to sign in (HTTP 503): Down for maintenance.',
  },
]

/** The fields typed, by label, and the messages the form shows before sending. */
export const missingFieldCases = [
  {
    name: 'the email and the password',
    typed: {},
    messages: ['Enter your email.', 'Enter your password.'],
  },
  {
    name: 'the password',
    typed: { Email: 'linh.pham@example.com' },
    messages: ['Enter your password.'],
  },
]
