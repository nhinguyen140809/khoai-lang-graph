'use client'

import Link from 'next/link'
import { Fragment, useRef } from 'react'

import {
  type ArtifactItem,
  ArtifactItemDetails,
  useItem,
  useItemSchema,
} from '@/modules/artifact/entities'
import { isNavigable } from '@/modules/workflow/entities'
import { isNotFoundError } from '@/shared/api/error'
import { ErrorState, LoadingState, NotFoundState } from '@/shared/components/state'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { useIdleVisibility } from '@/shared/lib/timing'
import { routes } from '@/shared/routes'

import { useItemCommands } from '../hooks/useItemCommands'
import { useItemPage } from '../hooks/useItemPage'
import { useItemTab } from '../hooks/useItemTab'
import { itemPageMessages, navigatorIdleMs } from '../item-page.constants'
import { ItemNavigator } from './ItemNavigator'

/**
 * The page of one item, in a tab of its own: a breadcrumb from its document down to its group, fixed
 * under the tab, its title, the line with its key, status and version, and its fields. Previous and Next float over
 * the page and open the item before and after it in the tab on screen.
 */
export function ItemPage({ projectId, itemId }: { projectId: string; itemId: string }) {
  const item = useItem(itemId)
  const { schema } = useItemSchema(item.data)
  useItemTab(projectId, itemId, item.data)
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
  if (item.data === undefined) return <LoadingState label={itemPageMessages.loading} />
  // An item that is read in place in its document has no page of its own.
  if (schema !== undefined && !isNavigable(schema)) return notFound
  return <ItemPageBody projectId={projectId} record={item.data} />
}

function ItemPageBody({ projectId, record }: { projectId: string; record: ArtifactItem }) {
  const project = routes.project(projectId)
  const page = useItemPage(projectId, record)
  const { neighbors, moveTo } = page
  const pageRef = useRef<HTMLDivElement>(null)
  const { isShown, show, holdProps } = useIdleVisibility(pageRef, { idleMs: navigatorIdleMs })
  useItemCommands(neighbors, moveTo, show)

  return (
    <div ref={pageRef} className="relative flex h-full flex-col">
      {/* The path stays under the tab while the item scrolls. */}
      <header className="shrink-0 border-b px-6 py-2">
        <Breadcrumb aria-label={itemPageMessages.location}>
          <BreadcrumbList>
            <BreadcrumbItem>
              {page.documentTitle === null ? (
                <BreadcrumbPage>{itemPageMessages.titleLoading}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={project.document(record.artifact_id)}>{page.documentTitle}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {page.steps.map((step) => (
              <Fragment key={step.id}>
                <BreadcrumbSeparator>{itemPageMessages.separator}</BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>{step.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <article className="mx-auto max-w-3xl space-y-4 p-6 pb-20">
          <h1 className="text-2xl font-semibold">{page.title}</h1>
          {page.schema !== undefined && page.status !== undefined && (
            <ArtifactItemDetails
              item={record}
              schema={page.schema}
              status={page.status}
              isUnderReview={page.isUnderReview}
            />
          )}
        </article>
      </ScrollArea>
      <ItemNavigator
        neighbors={neighbors}
        isShown={isShown}
        holdProps={holdProps}
        onPrevious={() => {
          moveTo(neighbors.previous)
        }}
        onNext={() => {
          moveTo(neighbors.next)
        }}
      />
    </div>
  )
}
