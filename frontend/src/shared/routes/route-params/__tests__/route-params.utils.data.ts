/** The query of a page, and the one page to return to that it names. */
export const nextParamCases = [
  { name: 'one value', query: { next: '/settings' }, next: '/settings' },
  { name: 'several values', query: { next: ['/a', '/b'] }, next: null },
  { name: 'no value', query: {}, next: null },
]
