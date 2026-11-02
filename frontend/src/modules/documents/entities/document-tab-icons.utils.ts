import type { ContentDisplay } from '@/modules/workflow/entities/@x/documents'

import type { DocumentTabIconName } from './document-tab-icons.types'
/**
 * The name that the page of a document gives its tab icon, among the tab icons of Documents: the display of its first part, so that a
 * document of cards, of a table or of a transcript each has a look of its own, or a document alone
 * while the parts are not known. A document that waits for the review has its own.
 */
export function documentTabIconName(
  display: ContentDisplay = 'document',
  { isUnderReview }: { isUnderReview: boolean },
): DocumentTabIconName {
  return isUnderReview ? 'documents.review' : `documents.document.${display}`
}

/** The name that the page of an item gives its tab icon: the display of the kind of the item. */
export function itemTabIconName(display: ContentDisplay = 'document'): DocumentTabIconName {
  return `documents.item.${display}`
}
