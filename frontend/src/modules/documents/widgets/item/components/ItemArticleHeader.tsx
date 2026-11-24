import { ErrorBoundary } from 'react-error-boundary'

import { ItemHeading } from '@/modules/documents/entities'
import { avatarOf } from '@/modules/workflow/entities'

import { useItemPageContext } from '../hooks/useItemPageContext'
import { ItemActionsMenu } from './ItemActionsMenu'
import { ItemKeyLine } from './ItemKeyLine'
import { ItemLinkLineBlock, LinkLineError } from './ItemLinks'

/**
 * The title of the item with its actions. A page with an avatar (a profile) has the key line right
 * under the title, beside the avatar, and shows its links at its foot (see `ItemRelated`); any
 * other page has the key line and the link line under the title.
 */
export function ItemArticleHeader() {
  const { record, page, isEditing } = useItemPageContext()
  const hasAvatar = page.view?.hasAvatar ?? false

  return (
    <header className="space-y-2">
      {/* The actions of the item sit beside its title, down at its last line. */}
      <div
        className={
          hasAvatar ? 'flex flex-wrap items-center gap-4' : 'flex flex-wrap items-end gap-4'
        }
      >
        <ItemHeading
          hasAvatar={hasAvatar}
          title={page.title}
          place={page.neighbors.index}
          faceSeed={record.key}
          face={page.schema === undefined ? null : avatarOf(page.schema, record.content)}
        >
          {hasAvatar && <ItemKeyLineBlock />}
        </ItemHeading>
        {!isEditing && <ItemActionsMenu record={record} lockedReason={page.lockedReason} />}
      </div>
      {!hasAvatar && (
        <>
          <ItemKeyLineBlock />
          <ItemLinkLines />
        </>
      )}
    </header>
  )
}

/** Whether the lines of the item show: only the reading of the item has them. */
function isReading(context: ReturnType<typeof useItemPageContext>): boolean {
  return !(context.isEditing || context.page.isHistoryOpen || context.page.status === undefined)
}

/** The key line of the item, which only the reading of the item shows. */
function ItemKeyLineBlock() {
  const context = useItemPageContext()
  const { record, page } = context

  if (!isReading(context) || page.status === undefined) return null
  return (
    <ItemKeyLine
      item={record}
      status={page.status}
      isUnderReview={page.isUnderReview}
      fields={page.view?.keyLineFields}
    />
  )
}

/** The link line, with its own error state. */
function ItemLinkLines() {
  const context = useItemPageContext()
  const { projectId, record, page, links } = context

  if (!isReading(context)) return null
  return (
    <ErrorBoundary
      resetKeys={[record.id]}
      fallbackRender={({ resetErrorBoundary }) => <LinkLineError onRetry={resetErrorBoundary} />}
    >
      <ItemLinkLineBlock projectId={projectId} links={links} lockedReason={page.lockedReason} />
    </ErrorBoundary>
  )
}
