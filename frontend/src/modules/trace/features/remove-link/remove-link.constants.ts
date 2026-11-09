export const removeLinkMessages = {
  open: 'Remove this link',
  title: 'Remove this link?',
  /** The sentence of the link after its removal, then what leaving the link means. */
  description: (sentenceAfterRemoval: string) =>
    `${sentenceAfterRemoval} The link leaves the graph, the lists and the pages of both items.`,
  remove: 'Remove the link',
  removed: 'The link is removed.',
} as const
