'use client'

import { ErrorBoundary } from 'react-error-boundary'

import { ItemRelated as FoldedLinks } from '@/modules/documents/entities'

import { useItemPageContext } from '../hooks/useItemPageContext'
import { ItemLinkLineBlock, LinkLineError } from './ItemLinks'

/**
 * The links of an item whose page has an avatar (a profile), folded at the foot of the page (see
 * the entity). Nothing shows where the item has no link, and while the page edits the item or shows
 * its versions.
 */
export function ItemRelated() {
  const { projectId, record, page, links, isEditing } = useItemPageContext()

  const isProfile = page.view?.hasAvatar === true
  if (!isProfile || isEditing || page.isHistoryOpen) return null
  if (links.state !== 'success' || links.count === 0) return null

  return (
    <FoldedLinks>
      <ErrorBoundary
        resetKeys={[record.id]}
        fallbackRender={({ resetErrorBoundary }) => <LinkLineError onRetry={resetErrorBoundary} />}
      >
        <ItemLinkLineBlock projectId={projectId} links={links} lockedReason={page.lockedReason} />
      </ErrorBoundary>
    </FoldedLinks>
  )
}
