'use client'

import {
  folderBlocks,
  isBranch,
  outlinePath,
  useArtifactOutline,
} from '@/modules/artifact/entities'
import { EmptyState, ErrorState, LoadingState, NotFoundState } from '@/shared/components/state'

import { readerMessages } from '../reader.constants'
import type { ReaderBodyProps } from '../reader.types'
import { ReaderBlocks } from './ReaderBlocks'
import { ContentBody } from './ReaderParts'

/** A folder of a document: the blocks that it holds in a grid, or why it does not show. */
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
      const blocks = folderBlocks(node.children, outline.kinds)
      return (
        <ContentBody title={node.title} renderTitle={renderTitle}>
          <div className="space-y-4 p-6">
            <h1 className="text-2xl font-semibold">{node.title}</h1>
            {blocks.length === 0 ? (
              <EmptyState
                title={messages.empty.title}
                description={messages.empty.description}
                className="px-0"
              />
            ) : (
              <ReaderBlocks blocks={blocks} artifactId={view.artifactId} hrefOf={hrefOf} />
            )}
          </div>
        </ContentBody>
      )
    }
  }
}
