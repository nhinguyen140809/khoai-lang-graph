// How many items a page of each list of items holds; the next page loads on demand.

/** An outline is read whole, so its items load in the largest pages. */
export const outlinePageSize = 200

export const itemsPageSize = 50

/** How long an item loaded ahead of time counts as fresh, in milliseconds. */
export const prefetchStaleMs = 30_000
