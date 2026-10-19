/** The meta of a query, and whether it marks the query as one that holds a cost. */
export const holdsCostCases = [
  { name: 'the meta of a cost', meta: { holdsCost: true }, holds: true },
  { name: 'another meta', meta: { other: true }, holds: false },
  { name: 'no meta', meta: undefined, holds: false },
]
