/** The query of a trace, the default depth, and what the validator reads from it. */
export const traceQueryCases = [
  {
    name: 'no parameter takes both directions and the default depth',
    query: '',
    defaultDepth: 5,
    expected: { direction: 'both', depth: 5 },
  },
  {
    name: 'no parameter and no default depth goes as far as the links go',
    query: '',
    defaultDepth: null,
    expected: { direction: 'both', depth: null },
  },
  {
    name: 'a direction and a depth',
    query: 'direction=backward&depth=2',
    defaultDepth: 5,
    expected: { direction: 'backward', depth: 2 },
  },
]

/** A query that the validator refuses, and the parameters it names. */
export const refusedTraceQueryCases = [
  { name: 'a direction it does not know', query: 'direction=sideways', fields: ['direction'] },
  { name: 'a depth of zero', query: 'depth=0', fields: ['depth'] },
  { name: 'a depth that is not a number', query: 'depth=deep', fields: ['depth'] },
  {
    name: 'both parameters wrong',
    query: 'direction=up&depth=-1',
    fields: ['direction', 'depth'],
  },
]
