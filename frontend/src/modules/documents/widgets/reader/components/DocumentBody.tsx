'use client'

import {
  ArtifactDocument,
  type ArtifactDocumentData,
  rootThumbnails,
  useArtifactDocument,
  useArtifactOutline,
} from '@/modules/artifact/entities'
import { useIsDocumentUnderReview } from '@/modules/documents/entities'
import { ErrorState, LoadingState, NotFoundState } from '@/shared/components/state'

import { readerMessages } from '../reader.constants'
import type { ReaderBodyProps } from '../reader.types'
import { ContentBody, ReaderLink } from './ReaderParts'
import { ReaderThumbnails } from './ReaderThumbnails'

/**
 * A document, its load, or why it does not show. A document that holds items is the grid of its
 * thumbnails, with its own text as the first of them (the overview); the overview, and a document that
 * holds nothing else, is the page of the document.
 */
export function DocumentBody(props: ReaderBodyProps<'document'>) {
  return <ArtifactBody {...props} />
}

/** The page of a document itself: its own text, whatever else the document holds. */
export function OverviewBody(props: ReaderBodyProps<'overview'>) {
  return <ArtifactBody {...props} />
}

function ArtifactBody({
  projectId,
  view,
  hrefOf,
  renderTitle,
}: ReaderBodyProps<'document'> | ReaderBodyProps<'overview'>) {
  const { artifactId } = view
  const document = useArtifactDocument(artifactId)
  const outline = useArtifactOutline(artifactId)
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
    case 'success': {
      if (view.kind === 'document') {
        if (outline.state === 'pending') {
          return (
            <ContentBody title={messages.loading} renderTitle={renderTitle}>
              <LoadingState label={messages.loading} layout="document" rows={4} />
            </ContentBody>
          )
        }
        const thumbnails =
          outline.state === 'success' && document.display !== 'transcript'
            ? rootThumbnails(outline.nodes, outline.kinds, { hasFields: document.fields.length > 0 })
            : []
        if (thumbnails.some(({ target }) => target.type !== 'overview')) {
          return (
            <ContentBody title={document.artifact.title} renderTitle={renderTitle}>
              <div className="space-y-4 p-6">
                <h1 className="text-2xl font-semibold">{document.artifact.title}</h1>
                <ReaderThumbnails thumbnails={thumbnails} artifactId={artifactId} hrefOf={hrefOf} />
              </div>
            </ContentBody>
          )
        }
      }
      return (
        <ContentBody title={document.artifact.title} renderTitle={renderTitle}>
          <DocumentPage document={document} isUnderReview={isUnderReview} hrefOf={hrefOf} />
        </ContentBody>
      )
    }
  }
}

/** The page of a document: its fields and its items, each item a link that opens it in the reader. */
function DocumentPage({
  document,
  isUnderReview,
  hrefOf,
}: {
  document: ArtifactDocumentData
  isUnderReview: boolean
  hrefOf: ReaderBodyProps<'document'>['hrefOf']
}) {
  return (
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
  )
}
