const thisItem = 'This item'

export const linkedItemMessages = {
  thisItem,
  itemLabel: (kindTitle: string, title: string) => `${kindTitle}, ${title}`,
  chipLabelOutOfDate: (kindTitle: string, title: string) =>
    `${kindTitle}, ${title}, made from an older version`,
  /** The words of the group of the links that reach the item, before its chips. */
  incoming: (title: string) => `${title} this item`,
  /** The sentence of the card of an item that quotes the words the page shows. */
  quotesSentence: (other: string) => `${other} quotes these words.`,
  outOfDate: (made: number, now: number) =>
    `This link was made from version ${String(made)}, and the item is now version ${String(now)}.`,
} as const
