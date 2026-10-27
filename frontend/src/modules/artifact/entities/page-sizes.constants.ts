// How many records a page of each list of the artifacts holds; the next page loads on demand.

/** A project holds a few artifacts, one for each kind and each persona: the list reads every page, usually one. */
export const artifactsPageSize = 200

/** An outline is read whole, so its items load in the largest pages. */
export const outlinePageSize = 200

export const itemsPageSize = 50

export const revisionsPageSize = 50

export const exportsPageSize = 50
