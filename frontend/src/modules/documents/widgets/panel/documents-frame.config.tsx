import {
  CircleAlertIcon,
  FilesIcon,
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
} from 'lucide-react'
import type { ReactNode } from 'react'

import type { DocumentTabIconName } from '@/modules/documents/entities'
import type { FeatureDestination } from '@/shared/components/frame'
import { ColoredText } from '@/shared/components/ui/colored-text'
import { encodeId } from '@/shared/lib/url'
import { routes } from '@/shared/routes'

import { DocumentsPanel } from './components/DocumentsPanel'

/**
 * The icons of the tabs of Documents, by the name a page gives its tab. A document takes the icon of
 * the display of its first part, an item the icon of the display of its kind, and a document that
 * waits for the review of the user an icon in the color of what asks something.
 */
export const documentTabIcons = {
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
  'documents.item.document': <TextIcon />,
  'documents.item.heading': <HeadingIcon />,
  'documents.item.table': <RowsIcon />,
  'documents.item.cards': <IdCardIcon />,
  'documents.item.transcript': <MessageSquareIcon />,
} as const satisfies Record<DocumentTabIconName, ReactNode>

/** Documents on the activity bar of a project: the documents, their outline and the items. */
export function documentsDestination(projectId: string): FeatureDestination {
  return {
    id: 'documents',
    label: 'Documents',
    icon: <FilesIcon />,
    href: routes.project(projectId).documents(),
    paths: [`/projects/${encodeId(projectId)}/items`],
    panel: <DocumentsPanel projectId={projectId} />,
  }
}
