import { linhFields } from '../../shared/accounts.constants'
import type { Fields } from '../../shared/steps'

/** A form of the account, filled in and sent, and the page that opens after it. */
export const sentFormCases: {
  name: string
  address: string
  fields: Fields
  submit: string
  opens: RegExp
}[] = [
  {
    name: 'logs in and returns to the page asked for',
    address: '/login?next=%2Fsettings',
    fields: linhFields,
    submit: 'Log in',
    opens: /\/settings$/,
  },
  {
    name: 'logs in and opens the project list without a page asked for',
    address: '/login',
    fields: linhFields,
    submit: 'Log in',
    opens: /\/projects$/,
  },
  {
    name: 'creates an account, logs in with it, and returns to the page asked for',
    address: '/register?next=%2Fsettings',
    fields: { Name: 'An Tran', Email: 'an@example.com', Password: 'secret' },
    submit: 'Register',
    opens: /\/settings$/,
  },
]

/** A form of the account that is refused, what it says, and the page that stays open. */
export const refusedFormCases: {
  name: string
  address: string
  fields: Fields
  submit: string
  message: string
  stays: RegExp
}[] = [
  {
    name: 'says when the email or the password is wrong',
    address: '/login?mock-login=error',
    fields: { ...linhFields, Password: 'wrong' },
    submit: 'Log in',
    message: 'The email or the password is wrong.',
    stays: /\/login/,
  },
  {
    name: 'says when the email has an account',
    address: '/register?mock-register=error',
    fields: { Name: 'Linh Pham', ...linhFields },
    submit: 'Register',
    message: 'An account with this email exists.',
    stays: /\/register/,
  },
]

/** A link between the login and register pages, which keeps the page asked for. */
export const switchCases: { name: string; address: string; link: string; opens: RegExp }[] = [
  {
    name: 'goes from logging in to registering',
    address: '/login?next=%2Fsettings',
    link: 'Create an account',
    opens: /\/register\?next=%2Fsettings$/,
  },
  {
    name: 'goes from registering to logging in',
    address: '/register?next=%2Fsettings',
    link: 'Log in',
    opens: /\/login\?next=%2Fsettings$/,
  },
]
