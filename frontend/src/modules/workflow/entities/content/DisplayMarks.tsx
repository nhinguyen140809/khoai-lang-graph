import {
  CircleAlertIcon,
  FileTextIcon,
  HeadingIcon,
  IdCardIcon,
  LayoutGridIcon,
  ListTreeIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
  RowsIcon,
  TableIcon,
  TextIcon,
  UserRoundIcon,
  UsersIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { ColoredText } from '@/shared/components/ui/colored-text'

import type { ContentDisplay } from './fields/content-fields.types'

/**
 * The names of the marks of Documents: one for each display of a document and of an item, and one
 * for a document that waits for the review of the user.
 */
export type DocumentMarkName =
  'documents.review' | `documents.${'document' | 'item'}.${ContentDisplay}`

/**
 * The mark of a document and of an item, by the display of its kind: the drawing that the Documents
 * panel, the tab of a page and the card of a message in the chat all show. A map in one place, so
 * one kind stays one picture wherever it appears, and changing it changes every place at once.
 */
export const documentMarks = {
  'documents.review': (
    <ColoredText color="warning" className="flex">
      <CircleAlertIcon />
    </ColoredText>
  ),
  'documents.document.document': <FileTextIcon />,
  'documents.document.heading': <ListTreeIcon />,
  'documents.document.table': <TableIcon />,
  'documents.document.cards': <LayoutGridIcon />,
  'documents.document.transcript': <MessagesSquareIcon />,
  'documents.document.profile': <UsersIcon />,
  'documents.item.document': <TextIcon />,
  'documents.item.heading': <HeadingIcon />,
  'documents.item.table': <RowsIcon />,
  'documents.item.cards': <IdCardIcon />,
  'documents.item.transcript': <MessageSquareIcon />,
  'documents.item.profile': <UserRoundIcon />,
} as const satisfies Record<DocumentMarkName, ReactNode>

/** The mark of a document by the display of its first part, or the mark of a review that waits. */
export function documentMarkOf(
  display: ContentDisplay = 'document',
  { isUnderReview }: { isUnderReview: boolean },
): ReactNode {
  const name: DocumentMarkName = isUnderReview
    ? 'documents.review'
    : `documents.document.${display}`
  return documentMarks[name]
}

/** The mark of an item by the display of its kind. */
export function itemMarkOf(display: ContentDisplay = 'document'): ReactNode {
  const name: DocumentMarkName = `documents.item.${display}`
  return documentMarks[name]
}
