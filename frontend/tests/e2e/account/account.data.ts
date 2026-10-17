/** The fields of a form of the account, by their labels, with what the user types in them. */
type Fields = Record<string, string>

const linh: Fields = { Email: 'linh.pham@example.com', Password: 'secret' }

/** A form of the account, filled in and sent, and the page that opens after it. */
export const sentFormCases: {
  name: string
  address: string
  fields: Fields
  submit: string
  opens: RegExp
}[] = [
  {
    name: 'signs in and returns to the page asked for',
    address: '/login?next=%2Fsettings',
    fields: linh,
    submit: 'Sign in',
    opens: /\/settings$/,
  },
  {
    name: 'signs in and opens the project list without a page asked for',
    address: '/login',
    fields: linh,
    submit: 'Sign in',
    opens: /\/projects$/,
  },
  {
    name: 'creates an account, signs in with it, and returns to the page asked for',
    address: '/register?next=%2Fsettings',
    fields: { Name: 'An Tran', Email: 'an@example.com', Password: 'secret' },
    submit: 'Create account',
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
    fields: { Email: 'linh.pham@example.com', Password: 'wrong' },
    submit: 'Sign in',
    message: 'The email or the password is wrong.',
    stays: /\/login/,
  },
  {
    name: 'says when the email has an account',
    address: '/register?mock-register=error',
    fields: { Name: 'Linh Pham', ...linh },
    submit: 'Create account',
    message: 'An account with this email exists.',
    stays: /\/register/,
  },
]

/** A link between the two sign-in pages, which keeps the page asked for. */
export const switchCases: { name: string; address: string; link: string; opens: RegExp }[] = [
  {
    name: 'goes from signing in to creating an account',
    address: '/login?next=%2Fsettings',
    link: 'Create an account',
    opens: /\/register\?next=%2Fsettings$/,
  },
  {
    name: 'goes from creating an account to signing in',
    address: '/register?next=%2Fsettings',
    link: 'Sign in',
    opens: /\/login\?next=%2Fsettings$/,
  },
]
