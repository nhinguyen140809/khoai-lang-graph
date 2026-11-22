'use client'

import {
  folderThumbnails,
  isBranch,
  outlinePath,
  useArtifactOutline,
} from '@/modules/artifact/entities'
import { EmptyState, ErrorState, LoadingState, NotFoundState } from '@/shared/components/state'

import { readerMessages } from '../reader.constants'
import type { ReaderBodyProps } from '../reader.types'
import { ContentBody } from './ReaderParts'
import { ReaderThumbnails } from './ReaderThumbnails'

/** A folder of a document: the thumbnails that it holds in a grid, or why it does not show. */
export function FolderBody({ view, hrefOf, renderTitle }: ReaderBodyProps<'folder'>) {
  const outline = useArtifactOutline(view.artifactId)
  const messages = readerMessages.folder
  const document = readerMessages.document

  switch (outline.state) {
    case 'pending':
      return (
        <ContentBody title={document.loading} renderTitle={renderTitle}>
          <LoadingState label={document.loading} layout="list" rows={4} />
        </ContentBody>
      )
    case 'error':
      return (
        <ContentBody title={document.loadError} renderTitle={renderTitle}>
          <ErrorState message={document.loadError} onRetry={outline.retry} />
        </ContentBody>
      )
    case 'success': {
      const node = outlinePath(outline.nodes, view.nodeId).at(-1)
      if (node === undefined || !isBranch(node)) {
        return (
          <ContentBody title={messages.notFound.title} renderTitle={renderTitle}>
            <NotFoundState
              title={messages.notFound.title}
              description={messages.notFound.description}
            />
          </ContentBody>
        )
      }
      const thumbnails = folderThumbnails(node.children, outline.kinds)
      return (
        <ContentBody title={node.title} renderTitle={renderTitle}>
          <div className="space-y-4 p-6">
            <h1 className="text-2xl font-semibold">{node.title}</h1>
            {thumbnails.length === 0 ? (
              <EmptyState
                title={messages.empty.title}
                description={messages.empty.description}
                className="px-0"
              />
            ) : (
              <ReaderThumbnails
                thumbnails={thumbnails}
                artifactId={view.artifactId}
                hrefOf={hrefOf}
              />
            )}
          </div>
        </ContentBody>
      )
    }
  }
}
