import { FilesIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { documentMarks, type DocumentTabIconName } from '@/modules/documents/entities'
import type { FeatureDestination } from '@/shared/components/frame'
import { encodeId } from '@/shared/lib/url'
import { routes } from '@/shared/routes'

import { DocumentsPanel } from './components/DocumentsPanel'

/**
 * The icons of the tabs of Documents, by the name a page gives its tab. A document takes the icon of
 * the display of its first part, an item the icon of the display of its kind, and a document that
 * waits for the review of the user an icon in the color of what asks something.
 */
export const documentTabIcons: Record<DocumentTabIconName, ReactNode> = documentMarks

/**
 * Documents on the activity bar of a project: the documents, their outline and the items.
 * @view developer
 */
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
