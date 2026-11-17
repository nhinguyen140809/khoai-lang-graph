import type { ChatReference } from '@/modules/activity/entities'

/** What the reader beside the chat shows: the list of the documents of the project, or a reference of the chat. */
export type ReaderView = { kind: 'documents' } | ChatReference
