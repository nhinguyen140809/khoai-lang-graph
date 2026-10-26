/** Values of the variables that the app accepts. */
export const validEnvCases = [
  { name: 'a production build', values: { NODE_ENV: 'production' } },
  {
    name: 'mocks that are enabled',
    values: { NODE_ENV: 'development', NEXT_PUBLIC_API_MOCKING: 'enabled' },
  },
  {
    name: 'mocks that are disabled',
    values: { NODE_ENV: 'test', NEXT_PUBLIC_API_MOCKING: 'disabled' },
  },
]

/** Values of the variables that the app refuses. */
export const invalidEnvCases = [
  { name: 'no environment', values: {} },
  { name: 'an unknown environment', values: { NODE_ENV: 'staging' } },
  {
    name: 'a mocking flag that is neither',
    values: { NODE_ENV: 'test', NEXT_PUBLIC_API_MOCKING: 'yes' },
  },
]
