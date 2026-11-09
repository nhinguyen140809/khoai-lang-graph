/** The note of a link: at most how many characters it holds, and from how many its counter shows. */
export const linkNote = { maxLength: 500, counterFrom: 400 } as const

/** How long the search of the other item waits after the last key. */
export const targetSearchDebounceMs = 250

export const addLinkMessages = {
  open: 'Link to another item',
  title: (itemTitle: string) => `Link ${itemTitle} to another item`,
  description:
    'A link records that this item is based on another item, or that it is about another item. The agents read the links when they work again.',
  linkType: 'Kind of link',
  target: 'Other item',
  targetPlaceholder: 'Search by words of the title or by key',
  moreResults: 'Type more words to narrow the results.',
  noResults: 'No item matches these words.',
  note: 'Note',
  noteHint: 'Optional. Say why the two items are linked.',
  noteTooLong: `Write at most ${String(linkNote.maxLength)} characters.`,
  chooseLinkType: 'Choose the kind of link.',
  chooseTarget: 'Choose the other item.',
  cancel: 'Cancel',
  add: 'Add the link',
  adding: 'Adding the link',
  added: 'The link is added.',
} as const
