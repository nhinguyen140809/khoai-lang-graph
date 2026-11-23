'use client'

import { documentsMessages, useDocumentList } from '@/modules/documents/entities'
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { ThumbnailGrid } from '@/shared/components/thumbnail'

import type { ReaderBodyProps } from '../reader.types'
import { viewOfEntry } from '../reader.utils'
import { DocumentThumbnail } from './DocumentThumbnail'
import { ContentBody } from './ReaderParts'

/** The documents of the project as thumbnails of a grid, the documents of one kind as a folder that opens them, or their state. */
export function DocumentListBody({ projectId, hrefOf, renderTitle }: ReaderBodyProps<'documents'>) {
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
          <div className="space-y-6 p-6">
            <h1 className="text-2xl font-semibold">{documentsMessages.title}</h1>
            {list.entries.length === 0 ? (
              <EmptyState
                title={documentsMessages.empty.title}
                description={documentsMessages.empty.description}
                className="px-0"
              />
            ) : (
              <ThumbnailGrid>
                {list.entries.map((entry) => (
                  <DocumentThumbnail
                    key={`${entry.type}:${entry.kind}`}
                    kind={entry.kind}
                    title={entry.title}
                    view={viewOfEntry(entry)}
                    mark={entry.mark}
                    isGroup={entry.type === 'group'}
                    hrefOf={hrefOf}
                  />
                ))}
              </ThumbnailGrid>
            )}
          </div>
        </ContentBody>
      )
  }
}
