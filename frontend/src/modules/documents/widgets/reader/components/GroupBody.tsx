'use client'

import { documentsMessages, useDocumentList } from '@/modules/documents/entities'
import { ErrorState, LoadingState, NotFoundState } from '@/shared/components/state'
import { ThumbnailGrid } from '@/shared/components/thumbnail'

import { readerMessages } from '../reader.constants'
import type { ReaderBodyProps } from '../reader.types'
import { DocumentThumbnail } from './DocumentThumbnail'
import { ContentBody } from './ReaderParts'

/**
 * The folder of the documents of one kind, such as the interviews: one thumbnail for each, and one
 * for each subject that has no document yet, muted. A folder holds a document or more, so one that
 * holds a single document is still a folder.
 */
export function GroupBody({ projectId, view, hrefOf, renderTitle }: ReaderBodyProps<'group'>) {
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
    case 'success': {
      const group = list.entries.find(
        (entry) => entry.type === 'group' && entry.kind === view.documentKind,
      )
      if (group?.type !== 'group') {
        const messages = readerMessages.group.notFound
        return (
          <ContentBody title={messages.title} renderTitle={renderTitle}>
            <NotFoundState title={messages.title} description={messages.description} />
          </ContentBody>
        )
      }
      return (
        <ContentBody title={group.title} renderTitle={renderTitle}>
          <div className="space-y-4 p-6">
            <h1 className="text-2xl font-semibold">{group.title}</h1>
            <ThumbnailGrid>
              {group.documents.map(({ artifact, mark }) => (
                <DocumentThumbnail
                  key={artifact.id}
                  kind={artifact.kind}
                  title={artifact.title}
                  view={{ kind: 'document', artifactId: artifact.id }}
                  mark={mark}
                  hrefOf={hrefOf}
                />
              ))}
              {group.notStarted.map((subject) => (
                <DocumentThumbnail
                  key={subject.id}
                  kind={group.kind}
                  title={subject.title}
                  view={null}
                  mark="notStarted"
                  hrefOf={hrefOf}
                />
              ))}
            </ThumbnailGrid>
          </div>
        </ContentBody>
      )
    }
  }
}
