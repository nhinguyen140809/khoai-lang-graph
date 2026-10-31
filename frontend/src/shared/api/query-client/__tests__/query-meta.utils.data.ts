/** The meta of a query, and whether it marks the query as one that holds a cost. */
export const hasCostCases = [
  { name: 'the meta of a cost', meta: { hasCost: true }, hasCost: true },
  { name: 'another meta', meta: { other: true }, hasCost: false },
  { name: 'no meta', meta: undefined, hasCost: false },
]
