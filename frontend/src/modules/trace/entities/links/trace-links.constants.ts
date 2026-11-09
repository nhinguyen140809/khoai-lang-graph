/** The link type that builds one item from another. */
export const derivedFrom = 'derived_from'

/** The link type that ties an item to the words of an interview message it was taken from. */
export const evidencedBy = 'evidenced_by'

/** How many items a search for the other end of a link offers; the rest waits for narrower words. */
export const linkTargetsPageSize = 20

/**
 * How the type of a link reads between its two items in a sentence, by its key: the item the
 * link leaves comes first, the item it reaches last. `now` reads today, `will` follows "will".
 * A type the map does not hold reads by its title, in the words of `hasALinkTo`.
 */
export const linkTypeWords = {
  derived_from: { now: 'is based on', will: 'be based on' },
  evidenced_by: { now: 'is evidenced by', will: 'be evidenced by' },
  stated_by: { now: 'is stated by', will: 'be stated by' },
  involves: { now: 'involves', will: 'involve' },
  concerns: { now: 'applies to', will: 'apply to' },
  resolved_by: { now: 'is resolved by', will: 'be resolved by' },
  flags: { now: 'points out', will: 'point out' },
  depends_on: { now: 'depends on', will: 'depend on' },
  duplicates: { now: 'is the same as', will: 'be the same as' },
  supersedes: { now: 'replaces', will: 'replace' },
} as Record<string, { now: string; will: string }>
