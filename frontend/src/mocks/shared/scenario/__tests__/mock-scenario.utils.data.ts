/** A page address with parameters. */
export const pageUrlWithParams = '/login?mock-reset&next=%2Fsettings'

/** A parameter, and its value in `pageUrlWithParams`. */
export const pageUrlParamCases = [
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

/** A page address, and the scenario that the handler of the user answers itself there. */
export const handlerScenarioCases = [
  { name: 'the fixtures', address: '/', scenario: 'default' },
  { name: 'the empty scenario', address: '/?mock-me=empty', scenario: 'empty' },
]
