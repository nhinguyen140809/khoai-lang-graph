import type { Query } from '@tanstack/react-query'

/** Whether a query holds a cost, by its meta, for `invalidateQueries({ predicate })`. */
export function hasCost(query: Pick<Query, 'meta'>): boolean {
  return query.meta?.hasCost === true
}
