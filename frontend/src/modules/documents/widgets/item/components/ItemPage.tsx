'use client'

import { useDeferredValue, useRef, ViewTransition } from 'react'

import {
  type ArtifactItem,
  HistorySurface,
  useItem,
  useItemSchema,
} from '@/modules/artifact/entities'
import { useIsEditing } from '@/modules/artifact/features/edit'
import { RestoreVersionMenuItem } from '@/modules/artifact/features/restore'
import { useItemLinks } from '@/modules/trace/entities'
import { isNavigable } from '@/modules/workflow/entities'
import { isNotFoundError } from '@/shared/api/error'
import { ErrorState, LoadingState, NotFoundState } from '@/shared/components/state'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { useIdleVisibility } from '@/shared/lib/idle-visibility'

import { useItemCommands } from '../hooks/useItemCommands'
import { useItemPage } from '../hooks/useItemPage'
import { ItemPageContext } from '../hooks/useItemPageContext'
import { useItemTab } from '../hooks/useItemTab'
import { itemContentShare, itemPageMessages, navigatorIdleMs } from '../item-page.constants'
import { ItemArticleHeader } from './ItemArticleHeader'
import { ItemBody } from './ItemBody'
import { ItemBreadcrumb } from './ItemBreadcrumb'
import { ItemNavigator } from './ItemNavigator'

/**
 * The page of one item, in a tab of its own, in three modes: Read shows the title with Edit, the
 * key line with the link line under it, and the fields with the quoted words marked, each opening
 * the card of the items at the other end of its link, with the history surface in the corner; History shows the selected version in
 * place of the fields; Edit shows the form alone. An item of a kind that is read in place in its
 * document, or that does not exist, shows the state instead.
 */
export function ItemPage({ projectId, itemId }: { projectId: string; itemId: string }) {
  const item = useItem(itemId)
  // The item that arrives after the loading state takes its place in a transition, so that the
  // content crosses over with the loading state instead of replacing it at once.
  const record = useDeferredValue(item.data)
  const { schema } = useItemSchema(record)
  const notFound = (
    <NotFoundState
      title={itemPageMessages.notFound.title}
      description={itemPageMessages.notFound.description}
    />
  )

  if (item.isError) {
    if (isNotFoundError(item.error)) return notFound
    return <ErrorState message={itemPageMessages.loadError} onRetry={() => void item.refetch()} />
  }
  if (record === undefined) {
    return (
      <ViewTransition name="item-content" share={itemContentShare} default="none">
        <LoadingState label={itemPageMessages.loading} layout="detail" rows={3} />
      </ViewTransition>
    )
  }
  // An item that is read in place in its document has no page of its own.
  if (schema !== undefined && !isNavigable(schema)) return notFound
  return <ItemPageBody projectId={projectId} record={record} />
}

function ItemPageBody({ projectId, record }: { projectId: string; record: ArtifactItem }) {
  const target = { type: 'item' as const, id: record.id }
  const isEditing = useIsEditing(target)
  const keepTab = useItemTab(projectId, record.id, record)
  const page = useItemPage(projectId, record, { isEditing })
  const links = useItemLinks(record.id)
  const pageRef = useRef<HTMLDivElement>(null)
  const { isShown, show, holdProps } = useIdleVisibility(pageRef, { idleMs: navigatorIdleMs })
  useItemCommands(page.neighbors, page.moveTo, show, { isEnabled: !isEditing })

  return (
    <ItemPageContext
      value={{
        projectId,
        record,
        page,
        links,
        isEditing,
        keepTab,
      }}
    >
      <div ref={pageRef} className="flex h-full flex-col">
        {/* The path stays under the tab while the item scrolls. */}
        <header className="shrink-0 border-b px-6 py-2">
          <ItemBreadcrumb />
        </header>
        <div className="relative min-h-0 flex-1">
          <ScrollArea selfScrolling className="h-full">
            <ViewTransition
              key={record.id}
              name="item-content"
              share={itemContentShare}
              default="none"
            >
              <article className="mx-auto max-w-3xl space-y-4 p-6 pb-20">
                <ItemArticleHeader />
                <ItemBody />
              </article>
            </ViewTransition>
          </ScrollArea>
          {!isEditing && (
            <>
              <HistorySurface
                target={target}
                currentVersion={record.version}
                view={page.history}
                renderRestore={(version) => (
                  <RestoreVersionMenuItem
                    target={target}
                    version={version}
                    lockedReason={page.lockedReason}
                  />
                )}
              />
              <ItemNavigator
                neighbors={page.neighbors}
                isShown={isShown}
                holdProps={holdProps}
                onPrevious={() => {
                  page.moveTo(page.neighbors.previous, 'previous')
                }}
                onNext={() => {
                  page.moveTo(page.neighbors.next, 'next')
                }}
              />
            </>
          )}
        </div>
      </div>
    </ItemPageContext>
  )
}
