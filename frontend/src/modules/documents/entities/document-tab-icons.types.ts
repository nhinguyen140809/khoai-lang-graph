import type { ContentDisplay } from '@/modules/workflow/entities/@x/documents'

/**
 * The names of the tab icons of Documents: one for each display of a document and of an item, and
 * one for a document that waits for the review of the user.
 */
export type DocumentTabIconName =
  'documents.review' | `documents.${'document' | 'item'}.${ContentDisplay}`
