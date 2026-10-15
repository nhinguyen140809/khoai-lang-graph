/** A page address with parameters. */
export const addressWithParams = '/login?mock-reset&next=%2Fsettings'

/** A parameter, and its value in `addressWithParams`. */
export const pageParamCases = [
  { name: 'the value of a parameter', param: 'next', value: '/settings' },
  { name: 'an empty value for a parameter without one', param: 'mock-reset', value: '' },
  { name: 'nothing for a parameter that is not there', param: 'mock-me', value: null },
]

/** The scenarios that the page address can choose for a resource. */
export const chosenScenarios = ['empty', 'error', 'loading']

/** A page address in which the user resource answers its fixtures. */
export const fixtureScenarioCases = [
  { name: 'without a parameter', address: '/' },
  { name: 'with an unknown value', address: '/?mock-me=broken' },
  { name: 'with a scenario for another resource', address: '/?mock-threads=error' },
]

/** The scenarios that each handler answers itself. */
export const handlerScenarios = ['default', 'empty'] as const
