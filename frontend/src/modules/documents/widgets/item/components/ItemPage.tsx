'use client'

import Link from 'next/link'
import { Fragment, type ReactNode, useRef, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import {
  type ArtifactItem,
  ArtifactItemDetails,
  HistorySurface,
  ItemHeading,
  ItemKeyLine,
  RevisionContent,
  useItem,
  useItemSchema,
} from '@/modules/artifact/entities'
import { EditItemForm, EditRecordButton, useIsEditing } from '@/modules/artifact/features/edit'
import { RestoreVersionMenuItem } from '@/modules/artifact/features/restore'
import { QuotedWordsPopover, quoteMarkColors, useItemLinks } from '@/modules/trace/entities'
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
import { useIdleVisibility } from '@/shared/lib/idle-visibility'
import { routes } from '@/shared/routes'

import { useItemCommands } from '../hooks/useItemCommands'
import { useItemPage } from '../hooks/useItemPage'
import { useItemTab } from '../hooks/useItemTab'
import { itemPageMessages, navigatorIdleMs } from '../item-page.constants'
import { ItemLinkLine } from './ItemLinkLine'
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
  const { schema } = useItemSchema(item.data)
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
  const target = { type: 'item' as const, id: record.id }
  const isEditing = useIsEditing(target)
  const keepTab = useItemTab(projectId, record.id, record)
  const page = useItemPage(projectId, record, { isEditing })
  const links = useItemLinks(record.id)
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const { isShown, show, holdProps } = useIdleVisibility(pageRef, { idleMs: navigatorIdleMs })
  useItemCommands(page.neighbors, page.moveTo, show, { isEnabled: !isEditing })

  return (
    <div ref={pageRef} className="flex h-full flex-col">
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
            <BreadcrumbSeparator>{itemPageMessages.separator}</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{page.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="relative min-h-0 flex-1">
        <ScrollArea className="h-full">
          <article className="mx-auto max-w-3xl space-y-4 p-6 pb-20">
            <header className="space-y-2">
              <div className="flex flex-wrap items-center gap-4">
                <ItemHeading schema={page.schema} title={page.title} place={page.neighbors.index} />
                {!isEditing && (
                  <EditRecordButton target={target} lockedReason={page.lockedReason} />
                )}
              </div>
              {!isEditing && !page.isHistoryOpen && page.status !== undefined && (
                <>
                  <ItemKeyLine
                    item={record}
                    status={page.status}
                    isUnderReview={page.isUnderReview}
                    schema={page.schema}
                  />
                  <ErrorBoundary
                    resetKeys={[record.id]}
                    fallbackRender={({ resetErrorBoundary }) => (
                      <LinkLineError onRetry={resetErrorBoundary} />
                    )}
                  >
                    <ItemLinkLineBlock
                      projectId={projectId}
                      links={links}
                      activeLinkId={activeLinkId}
                      onActiveLinkChange={setActiveLinkId}
                    />
                  </ErrorBoundary>
                </>
              )}
            </header>
            {isEditing ? (
              page.schema !== undefined && (
                <EditItemForm
                  item={record}
                  schema={page.schema}
                  lockedReason={page.lockedReason}
                  onChanged={page.reloadTraces}
                  onFirstChange={keepTab}
                />
              )
            ) : page.isHistoryOpen && page.schema !== undefined ? (
              <RevisionContent target={target} view={page.history} fields={page.fields} />
            ) : (
              page.schema !== undefined && (
                <>
                  <ArtifactItemDetails
                    item={record}
                    schema={page.schema}
                    fieldMarks={links.state === 'success' ? links.fieldMarks : undefined}
                    renderFieldMark={(range, children) => (
                      <ErrorBoundary resetKeys={[record.id]} fallbackRender={() => children}>
                        <FieldMarkPopover
                          projectId={projectId}
                          links={links}
                          range={range}
                          onActiveLinkChange={setActiveLinkId}
                        >
                          {children}
                        </FieldMarkPopover>
                      </ErrorBoundary>
                    )}
                  />
                </>
              )
            )}
          </article>
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
                page.moveTo(page.neighbors.previous)
              }}
              onNext={() => {
                page.moveTo(page.neighbors.next)
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}

/** The link line, with its own error state; nothing while it loads. */
function ItemLinkLineBlock({
  projectId,
  links,
  activeLinkId,
  onActiveLinkChange,
}: {
  projectId: string
  links: ReturnType<typeof useItemLinks>
  activeLinkId: string | null
  onActiveLinkChange: (linkId: string | null) => void
}) {
  if (links.state !== 'success' || links.count === 0) return null
  return (
    <ItemLinkLine
      projectId={projectId}
      links={links}
      activeLinkId={activeLinkId}
      onActiveLinkChange={onActiveLinkChange}
    />
  )
}

/** The error of the links block, with its way to try again. */
function LinkLineError({ onRetry }: { onRetry: () => void }) {
  return <ErrorState size="compact" message={itemPageMessages.linksLoadError} onRetry={onRetry} />
}

/** A mark of the quoted words, wrapped in the card of the items at the other end of its links. */
function FieldMarkPopover({
  projectId,
  links,
  range,
  onActiveLinkChange,
  children,
}: {
  projectId: string
  links: ReturnType<typeof useItemLinks>
  range: { id: string; linkIds: string[] }
  onActiveLinkChange: (linkId: string | null) => void
  children: ReactNode
}) {
  if (links.state !== 'success') return children
  const rows = range.linkIds.flatMap((id) => {
    const row = links.rowsByLinkId.get(id)
    return row === undefined ? [] : [row]
  })
  if (rows.length === 0) return children
  const outgoingIds = new Set(links.outgoing.flatMap(({ rows }) => rows.map((row) => row.link.id)))
  return (
    <QuotedWordsPopover
      projectId={projectId}
      entries={rows.map((row) => ({
        item: row.other,
        relation: {
          direction: outgoingIds.has(row.link.id) ? 'outgoing' : 'incoming',
          linkType: row.link.link_type,
        },
        isOutOfDate: row.isOutOfDate,
        otherQuote: outgoingIds.has(row.link.id) ? row.link.target_quote : row.link.source_quote,
        quoteColor: quoteMarkColors[outgoingIds.has(row.link.id) ? 'target' : 'source'],
        madeFromVersion: row.isOutOfDate ? row.link.target_version : null,
      }))}
    >
      <span
        onMouseEnter={() => {
          onActiveLinkChange(rows[0]?.link.id ?? null)
        }}
        onMouseLeave={() => {
          onActiveLinkChange(null)
        }}
      >
        {children}
      </span>
    </QuotedWordsPopover>
  )
}
