'use client'

import type { Route } from 'next'
import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

import {
  ArtifactDocument,
  type ArtifactItem,
  type ItemStatus,
  useArtifactDocument,
  useItem,
  useItemStatusLook,
} from '@/modules/artifact/entities'
import {
  type DocumentEntry,
  documentMarkLook,
  documentsMessages,
  useDocumentList,
  useIsDocumentUnderReview,
} from '@/modules/documents/entities'
import { ContentFieldValue, useWorkflowDefinition } from '@/modules/workflow/entities'
import { isNotFoundError } from '@/shared/api/error'
import { EmptyState, ErrorState, LoadingState, NotFoundState } from '@/shared/components/state'
import { Badge } from '@/shared/components/ui/badge'
import { ColoredText } from '@/shared/components/ui/colored-text'
import { Item, ItemActions, ItemContent, ItemTitle } from '@/shared/components/ui/item'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { cn } from '@/shared/lib/cn'

import { useReaderItem } from '../hooks/useReaderItem'
import { readerMessages } from '../reader.constants'
import type { ReaderView } from '../reader.types'

/** The address of the page with the reader open on a view. */
type ReaderHref = (view: ReaderView) => Route

interface ReaderContentProps {
  projectId: string
  view: ReaderView
  /** The address of the page with the reader open on another view, for the links inside it. */
  hrefOf: ReaderHref
  /**
   * Draws the title that names the reader to assistive technology, in the element that the place
   * of the reader needs. The content draws its own heading, so the title is no heading of its own.
   */
  renderTitle: (title: string) => ReactNode
}

/**
 * What the reader shows, read-only, in an area that scrolls on its own: the list of the documents
 * of the project, each a link that opens it in the reader, a document, whose items open in its
 * place, or an item.
 */
export function ReaderContent({ projectId, view, hrefOf, renderTitle }: ReaderContentProps) {
  switch (view.kind) {
    case 'documents':
      return <DocumentListBody projectId={projectId} hrefOf={hrefOf} renderTitle={renderTitle} />
    case 'document':
      return (
        <DocumentBody
          projectId={projectId}
          artifactId={view.artifactId}
          hrefOf={hrefOf}
          renderTitle={renderTitle}
        />
      )
    case 'item':
      return <ItemBody projectId={projectId} itemId={view.itemId} renderTitle={renderTitle} />
  }
}

/** The content under its title, in an area that scrolls. */
function ContentBody({
  title,
  renderTitle,
  children,
}: {
  title: string
  renderTitle: ReaderContentProps['renderTitle']
  children: ReactNode
}) {
  return (
    <>
      {renderTitle(title)}
      <ScrollArea className="min-h-0 flex-1">{children}</ScrollArea>
    </>
  )
}

/** A link inside the reader, which opens another view in it. */
function ReaderLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      scroll={false}
      className={cn('font-medium underline-offset-4 hover:underline', className)}
      {...props}
    />
  )
}

/** The documents of the project, grouped as the side panel of Documents groups them, or their state. */
function DocumentListBody({
  projectId,
  hrefOf,
  renderTitle,
}: {
  projectId: string
  hrefOf: ReaderHref
  renderTitle: ReaderContentProps['renderTitle']
}) {
  const list = useDocumentList(projectId)

  switch (list.state) {
    case 'pending':
      return (
        <ContentBody title={documentsMessages.loading} renderTitle={renderTitle}>
          <LoadingState label={documentsMessages.loading} layout="list" rows={4} />
        </ContentBody>
      )
    case 'error':
      return (
        <ContentBody title={documentsMessages.loadError} renderTitle={renderTitle}>
          <ErrorState message={documentsMessages.loadError} onRetry={list.retry} />
        </ContentBody>
      )
    case 'success':
      return (
        <ContentBody title={documentsMessages.title} renderTitle={renderTitle}>
          <div className="space-y-4 p-6">
            <h1 className="text-2xl font-semibold">{documentsMessages.title}</h1>
            {list.entries.length === 0 ? (
              <EmptyState
                title={documentsMessages.empty.title}
                description={documentsMessages.empty.description}
                className="px-0"
              />
            ) : (
              <ul className="flex flex-col gap-1">
                {list.entries.map((entry) => (
                  <DocumentEntryRows key={entry.kind} entry={entry} hrefOf={hrefOf} />
                ))}
              </ul>
            )}
          </div>
        </ContentBody>
      )
  }
}

/** One entry of the list: a document, or the documents of one kind under the title of the kind. */
function DocumentEntryRows({ entry, hrefOf }: { entry: DocumentEntry; hrefOf: ReaderHref }) {
  if (entry.type === 'document') {
    return (
      <li>
        <DocumentRow
          title={entry.title}
          artifactId={entry.artifact?.id ?? null}
          mark={entry.mark}
          hrefOf={hrefOf}
        />
      </li>
    )
  }
  return (
    <li className="pt-2">
      <h2 className="px-3 pb-1 text-sm font-semibold text-muted-foreground">{entry.title}</h2>
      <ul className="flex flex-col gap-1">
        {entry.documents.map(({ artifact, mark }) => (
          <li key={artifact.id}>
            <DocumentRow
              title={artifact.title}
              artifactId={artifact.id}
              mark={mark}
              hrefOf={hrefOf}
            />
          </li>
        ))}
        {entry.notStarted.map((subject) => (
          <li key={subject.id}>
            <DocumentRow
              title={subject.title}
              artifactId={null}
              mark="notStarted"
              hrefOf={hrefOf}
            />
          </li>
        ))}
      </ul>
    </li>
  )
}

/**
 * A document of the list: a link that opens it in the reader, with its mark when it asks for the
 * user or is being written. A document that is not started yet only reads, muted.
 */
function DocumentRow({
  title,
  artifactId,
  mark,
  hrefOf,
}: {
  title: string
  artifactId: string | null
  mark: DocumentEntry['mark']
  hrefOf: ReaderHref
}) {
  const look = documentMarkLook(mark)

  if (artifactId === null) {
    return (
      <Item size="sm" className="text-muted-foreground">
        <ItemContent>
          <ItemTitle className="font-normal">{title}</ItemTitle>
        </ItemContent>
        <ItemActions className="text-xs">{look.label}</ItemActions>
      </Item>
    )
  }
  return (
    <Item asChild size="sm">
      <ReaderLink href={hrefOf({ kind: 'document', artifactId })} className="hover:no-underline">
        <ItemContent>
          <ItemTitle>{title}</ItemTitle>
        </ItemContent>
        {look.level !== 'none' && look.color !== null && (
          <ItemActions>
            <Badge variant="soft" color={look.color}>
              {look.label}
            </Badge>
          </ItemActions>
        )}
      </ReaderLink>
    </Item>
  )
}

/** A document, its load, or why it does not show. */
function DocumentBody({
  projectId,
  artifactId,
  hrefOf,
  renderTitle,
}: {
  projectId: string
  artifactId: string
  hrefOf: ReaderHref
  renderTitle: ReaderContentProps['renderTitle']
}) {
  const document = useArtifactDocument(artifactId)
  const isUnderReview = useIsDocumentUnderReview(projectId, artifactId)
  const messages = readerMessages.document

  switch (document.state) {
    case 'pending':
      return (
        <ContentBody title={messages.loading} renderTitle={renderTitle}>
          <LoadingState label={messages.loading} layout="document" rows={4} />
        </ContentBody>
      )
    case 'notFound':
      return (
        <ContentBody title={messages.notFound.title} renderTitle={renderTitle}>
          <NotFoundState
            title={messages.notFound.title}
            description={messages.notFound.description}
          />
        </ContentBody>
      )
    case 'error':
      return (
        <ContentBody title={messages.loadError} renderTitle={renderTitle}>
          <ErrorState message={messages.loadError} onRetry={document.retry} />
        </ContentBody>
      )
    case 'success':
      return (
        <ContentBody title={document.artifact.title} renderTitle={renderTitle}>
          <ArtifactDocument
            data={document}
            isUnderReview={isUnderReview}
            renderItemLink={(item, title) => (
              <ReaderLink href={hrefOf({ kind: 'item', itemId: item.id })}>{title}</ReaderLink>
            )}
            renderItemIdLink={(itemId, children) => (
              <ReaderLink href={hrefOf({ kind: 'item', itemId })} className="hover:no-underline">
                {children}
              </ReaderLink>
            )}
          />
        </ContentBody>
      )
  }
}

/** An item, its load, or why it does not show. */
function ItemBody({
  projectId,
  itemId,
  renderTitle,
}: {
  projectId: string
  itemId: string
  renderTitle: ReaderContentProps['renderTitle']
}) {
  const item = useItem(itemId)
  const messages = readerMessages.item

  if (item.isError) {
    return isNotFoundError(item.error) ? (
      <ContentBody title={messages.notFound.title} renderTitle={renderTitle}>
        <NotFoundState
          title={messages.notFound.title}
          description={messages.notFound.description}
        />
      </ContentBody>
    ) : (
      <ContentBody title={messages.loadError} renderTitle={renderTitle}>
        <ErrorState message={messages.loadError} onRetry={() => void item.refetch()} />
      </ContentBody>
    )
  }
  if (item.data === undefined) {
    return (
      <ContentBody title={messages.loading} renderTitle={renderTitle}>
        <LoadingState label={messages.loading} layout="detail" rows={3} />
      </ContentBody>
    )
  }
  return <LoadedItem projectId={projectId} record={item.data} renderTitle={renderTitle} />
}

/** An item: the title of its kind, its title and its status, then its filled fields under their titles. */
function LoadedItem({
  projectId,
  record,
  renderTitle,
}: {
  projectId: string
  record: ArtifactItem
  renderTitle: ReaderContentProps['renderTitle']
}) {
  const item = useReaderItem(projectId, record)
  const { data: definition } = useWorkflowDefinition()

  return (
    <ContentBody title={item.title} renderTitle={renderTitle}>
      <article className="space-y-6 p-6">
        <header className="space-y-1">
          <p className="text-sm text-muted-foreground">{item.kindTitle}</p>
          <h1 className="text-2xl font-semibold">{item.title}</h1>
          {item.status !== undefined && (
            <ItemStatusLine status={item.status} isUnderReview={item.isUnderReview} />
          )}
        </header>
        {item.fields.map((field) => (
          <section key={field.name} className="space-y-1">
            <h2 className="text-sm font-semibold text-muted-foreground">{field.title}</h2>
            <div className="space-y-2">
              <ContentFieldValue
                field={field}
                value={record.content[field.name]}
                definition={definition}
              />
            </div>
          </section>
        ))}
      </article>
    </ContentBody>
  )
}

/** The status of an item in its color. */
function ItemStatusLine({ status, isUnderReview }: { status: ItemStatus; isUnderReview: boolean }) {
  const look = useItemStatusLook(status, { isUnderReview })

  return (
    <p className="text-sm">
      <ColoredText color={look.color} className="font-semibold">
        {look.label}
      </ColoredText>
    </p>
  )
}
