/** The words of the reader beside the chat, which shows a document or an item. */
export const readerMessages = {
  /** The button that closes the reader. */
  close: 'Close',
  document: {
    loading: 'Loading the document',
    loadError: 'The document could not load.',
    notFound: {
      title: 'Document not found',
      description: 'This document does not exist, or was deleted.',
    },
  },
  item: {
    loading: 'Loading the item',
    loadError: 'The item could not load.',
    notFound: { title: 'Item not found', description: 'This item does not exist, or was deleted.' },
  },
} as const
