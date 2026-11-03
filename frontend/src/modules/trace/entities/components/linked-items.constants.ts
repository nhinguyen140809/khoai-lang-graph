const thisItem = 'This item'

export const linkedItemMessages = {
  thisItem,
  itemLabel: (kindTitle: string, title: string) => `${kindTitle}, ${title}`,
  chipLabelOutOfDate: (kindTitle: string, title: string) =>
    `${kindTitle}, ${title}, made from an older version`,
  /**
   * How the type of a link reads between its two items in a sentence, by its key: the item the
   * link leaves comes first, the item it reaches last. A type the map does not hold reads by its
   * title, in the words of `hasALinkTo`.
   */
  linkTypeWords: {
    derived_from: 'is based on',
    evidenced_by: 'is evidenced by',
    stated_by: 'is stated by',
    involves: 'involves',
    concerns: 'applies to',
    resolved_by: 'is resolved by',
    flags: 'points out',
    depends_on: 'depends on',
    duplicates: 'is the same as',
    supersedes: 'replaces',
  } as Record<string, string>,
  /** The words a link of a type the map does not hold reads between its two items. */
  hasALinkTo: (linkTitle: string) => `has a "${linkTitle}" link to`,
  /** The words of the group of the links that reach the item, before its chips. */
  incoming: (title: string) => `${title} this item`,
  /** The sentence of the card of an item that quotes the words the page shows. */
  quotesSentence: (other: string) => `${other} quotes these words.`,
  outOfDate: (made: number, now: number) =>
    `This link was made from version ${String(made)}, and the item is now version ${String(now)}.`,
} as const
