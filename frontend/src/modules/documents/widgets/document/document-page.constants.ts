/** The words of the menu that gathers the actions of a document. */
export const documentActionsMessages = {
  more: 'More actions',
} as const

export const documentPageMessages = {
  choose: {
    title: 'Choose a document',
    description: 'Open a document from the side panel of Documents.',
  },
  tabTitle: 'Document',
  loading: 'Loading the document',
  loadError: 'The document could not load.',
  notFound: {
    title: 'Document not found',
    description: 'This document does not exist, or was deleted.',
  },
  openItem: (key: string) => `Open ${key}`,
} as const
