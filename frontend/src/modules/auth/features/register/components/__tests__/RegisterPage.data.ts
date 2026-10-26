import { HttpResponse } from 'msw'

/** The page to return to, and the page that opens once the account is created and logged in. */
export const returnCases = [
  { next: null, opens: '/' },
  { next: '/threads/t1', opens: '/threads/t1' },
]

/** An answer of POST /auth/register that fails, and the message under the form. */
export const failedRegisterCases = [
  {
    name: 'a problem of a field the form does not have',
    answer: () =>
      HttpResponse.json(
        { status: 422, errors: [{ field: 'body', message: 'Malformed JSON.' }] },
        { status: 422 },
      ),
    alert: 'Failed to create the account (HTTP 422)',
  },
  {
    name: 'a failure without field problems',
    answer: () => new HttpResponse(null, { status: 500 }),
    alert: 'Failed to create the account (HTTP 500)',
  },
]

/** The fields typed, by label, and the messages the form shows before sending. */
export const missingFieldCases = [
  {
    name: 'the name, the email and the password',
    typed: {},
    messages: ['Enter your name.', 'Enter an email address.', 'Enter a password.'],
  },
  {
    name: 'an email address',
    typed: { Name: 'An Tran', Email: 'not an email', Password: 'secret' },
    messages: ['Enter an email address.'],
  },
  {
    name: 'a password',
    typed: { Name: 'An Tran', Email: 'an@example.com' },
    messages: ['Enter a password.'],
  },
]
