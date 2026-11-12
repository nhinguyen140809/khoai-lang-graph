import { ErrorBoundary } from 'react-error-boundary'

import { useItemPageContext } from '../hooks/useItemPageContext'
import { ItemActionsMenu } from './ItemActionsMenu'
import { ItemHeading } from './ItemHeading'
import { ItemKeyLine } from './ItemKeyLine'
import { ItemLinkLineBlock, LinkLineError } from './ItemLinks'

/** The title of the item with its actions, and under it the key line and the link line. */
export function ItemArticleHeader() {
  const { record, page, isEditing } = useItemPageContext()

  return (
    <header className="space-y-2">
      {/* The actions of the item sit beside its title, down at its last line. */}
      <div className="flex flex-wrap items-end gap-4">
        <ItemHeading
          hasAvatar={page.view?.hasAvatar ?? false}
          title={page.title}
          place={page.neighbors.index}
        />
        {!isEditing && <ItemActionsMenu record={record} lockedReason={page.lockedReason} />}
      </div>
      <ItemLines />
    </header>
  )
}

/** The key line and the link line, which only the reading of the item shows. */
function ItemLines() {
  const { projectId, record, page, links, isEditing, activeLinkId, setActiveLinkId } =
    useItemPageContext()

  if (isEditing || page.isHistoryOpen || page.status === undefined) return null

  return (
    <>
      <ItemKeyLine
        item={record}
        status={page.status}
        isUnderReview={page.isUnderReview}
        fields={page.view?.keyLineFields}
      />
      <ErrorBoundary
        resetKeys={[record.id]}
        fallbackRender={({ resetErrorBoundary }) => <LinkLineError onRetry={resetErrorBoundary} />}
      >
        <ItemLinkLineBlock
          projectId={projectId}
          links={links}
          lockedReason={page.lockedReason}
          activeLinkId={activeLinkId}
          onActiveLinkChange={setActiveLinkId}
        />
      </ErrorBoundary>
    </>
  )
}
