import { seededAccount } from '../../shared/backend-env.constants'

/** A page that needs an account, and where an anonymous visit sends the user. */
export const guardedPages: { name: string; address: string; opens: RegExp }[] = [
  { name: 'the project list', address: '/projects', opens: /\/login\?next=%2Fprojects$/ },
  { name: 'the settings', address: '/settings', opens: /\/login\?next=%2Fsettings$/ },
]

/** A sign-in that the backend refuses, and what the form says. */
export const refusedSignIns = [
  {
    name: 'a wrong password',
    fields: { Email: seededAccount.email, Password: 'not-the-password' },
    message: 'The email or the password is wrong.',
  },
  {
    name: 'an unknown email',
    fields: { Email: 'nobody@example.com', Password: seededAccount.password },
    message: 'The email or the password is wrong.',
  },
]
