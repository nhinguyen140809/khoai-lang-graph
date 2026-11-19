'use client'

import { ArtifactDocument, useArtifactDocument } from '@/modules/artifact/entities'
import { useIsDocumentUnderReview } from '@/modules/documents/entities'
import { ErrorState, LoadingState, NotFoundState } from '@/shared/components/state'

import { readerMessages } from '../reader.constants'
import type { ReaderBodyProps } from '../reader.types'
import { ContentBody, ReaderLink } from './ReaderParts'

/** A document, its load, or why it does not show. */
export function DocumentBody({
  projectId,
  view,
  hrefOf,
  renderTitle,
}: ReaderBodyProps<'document'>) {
  const { artifactId } = view
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
