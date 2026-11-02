import { FilesIcon } from 'lucide-react'

import { EmptyState } from '@/shared/components/state'

import { documentPageMessages } from '../document-page.constants'

/** The start page of Documents: it asks to choose a document in the side panel. */
export function DocumentsHomePage() {
  return (
    <EmptyState
      icon={FilesIcon}
      title={documentPageMessages.choose.title}
      description={documentPageMessages.choose.description}
    />
  )
}
