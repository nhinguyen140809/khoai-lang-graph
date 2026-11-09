/** The words of the levels of attention, which the rows and the nodes of Trace read. */
export const attentionMessages = {
  /** Follow: the item is itself an open issue. */
  openIssue: 'This item is an open issue.',
  /** Quiet: the item was rejected or replaced. */
  rejected: 'This item was rejected.',
  replaced: 'This item was replaced.',
  /** Act: an open issue is about the item; the kind of the issue names it. */
  concerns: (kindTitle: string) => `An open ${kindTitle} concerns this item.`,
} as const
