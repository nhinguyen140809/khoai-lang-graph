/** The filters of a list, and the parameters of the query that they make. */
export const filterParamsCases = [
  {
    name: 'both filters',
    filters: { kind: 'persona', reviewStatus: 'draft' as const },
    params: { kind: 'persona', review_status: 'draft' },
  },
  {
    name: 'a kind',
    filters: { kind: 'persona' },
    params: { kind: 'persona', review_status: undefined },
  },
  { name: 'no filter', filters: {}, params: { kind: undefined, review_status: undefined } },
]
