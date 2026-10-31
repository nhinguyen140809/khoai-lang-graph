import { mePasswordFixture } from '../me.fixtures'

const longName = 'a'.repeat(101)

/** A body of PATCH /me that the mock accepts. */
export const acceptedUpdateMeBodies = [
  { name: 'an empty body', body: {} },
  { name: 'a name of 100 characters', body: { display_name: 'a'.repeat(100) } },
  { name: 'no picture', body: { avatar_url: null } },
  { name: 'an https address', body: { avatar_url: 'https://example.com/me.png' } },
  { name: 'an http address', body: { avatar_url: 'http://example.com/me.png' } },
]

/** A body of PATCH /me that the mock refuses, and the problems of its fields. */
export const refusedUpdateMeBodies = [
  {
    name: 'a name of 101 characters',
    body: { display_name: longName },
    problems: [{ field: 'display_name', message: 'Use at most 100 characters.' }],
  },
  {
    name: 'a name of spaces',
    body: { display_name: '   ' },
    problems: [{ field: 'display_name', message: 'Enter a value.' }],
  },
  {
    name: 'a name that is not text',
    body: { display_name: 7 },
    problems: [{ field: 'display_name', message: 'Send a value of type string.' }],
  },
  {
    name: 'an address that is not http',
    body: { avatar_url: 'ftp://example.com/me.png' },
    problems: [{ field: 'avatar_url', message: 'Send an http or https address.' }],
  },
  {
    name: 'text that is not an address',
    body: { avatar_url: 'not a url' },
    problems: [{ field: 'avatar_url', message: 'Send an http or https address.' }],
  },
  {
    name: 'a field that is not allowed',
    body: { email: 'an@example.com' },
    problems: [{ field: 'email', message: 'This field is not allowed.' }],
  },
]

/** A body of POST /me/password that the mock refuses, and the problems of its fields. */
export const refusedPasswordBodies = [
  {
    name: 'a wrong current password',
    body: { current_password: 'wrong', new_password: 'long-enough-1' },
    problems: [{ field: 'current_password', message: 'The current password is wrong.' }],
  },
  {
    name: 'a new password of 7 characters',
    body: { current_password: mePasswordFixture, new_password: '1234567' },
    problems: [{ field: 'new_password', message: 'Use at least 8 characters.' }],
  },
  {
    name: 'the same password',
    body: { current_password: mePasswordFixture, new_password: mePasswordFixture },
    problems: [{ field: 'new_password', message: 'Choose a password other than the current one.' }],
  },
  {
    name: 'a body without the new password',
    body: { current_password: mePasswordFixture },
    problems: [{ field: 'new_password', message: 'This field is required.' }],
  },
]
