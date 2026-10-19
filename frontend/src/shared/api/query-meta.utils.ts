import type { Query } from '@tanstack/react-query'

/**
 * The meta of a query whose data holds a cost, such as the usage of the month. An event of a run
 * that changes a cost loads every such query again, whichever feature defines it.
 */
export const costQueryMeta = { holdsCost: true }

/** Whether a query holds a cost, by its meta, for `invalidateQueries({ predicate })`. */
export function holdsCost(query: Pick<Query, 'meta'>): boolean {
  return query.meta?.holdsCost === true
}
