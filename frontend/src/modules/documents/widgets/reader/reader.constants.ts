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
  group: {
    notFound: {
      title: 'Documents not found',
      description: 'There are no documents of this kind in the project.',
    },
  },
  folder: {
    notFound: {
      title: 'Folder not found',
      description: 'This folder does not exist, or was deleted.',
    },
    empty: {
      title: 'Nothing in this folder yet',
      description: 'Its items will show here when they are written.',
    },
  },
  /** The offer of another view while the reader shows one: it does not take the place of what is read until the user says so. */
  offer: { open: 'Open', dismiss: 'Not now' },
  /** The label of the path above the content, which says where the reader is. */
  location: 'Where you are',
  /** The mark between two steps of the path. */
  separator: '/',
  item: itemLoadMessages,
} as const
