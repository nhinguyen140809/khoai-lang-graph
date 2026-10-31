/**
 * The meta of a query whose data holds a cost, such as the usage of the month. An event of a run
 * that changes a cost loads every such query again, whichever module defines it.
 */
export const costQueryMeta = { hasCost: true }
