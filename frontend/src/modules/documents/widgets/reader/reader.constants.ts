import { itemLoadMessages } from '@/modules/documents/entities'

/** The words of the reader beside the chat, which shows a document or an item. */
export const readerMessages = {
  /** The button that goes back to the view before in the reader. */
  back: 'Back',
  document: {
    loading: 'Loading the document',
    loadError: 'The document could not load.',
    notFound: {
      title: 'Document not found',
      description: 'This document does not exist, or was deleted.',
    },
  },
  item: itemLoadMessages,
} as const
