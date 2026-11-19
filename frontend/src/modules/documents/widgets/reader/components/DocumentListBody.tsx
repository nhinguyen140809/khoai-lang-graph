'use client'

import {
  type DocumentEntry,
  documentMarkLook,
  documentsMessages,
  useDocumentList,
} from '@/modules/documents/entities'
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { Badge } from '@/shared/components/ui/badge'
import { Item, ItemActions, ItemContent, ItemTitle } from '@/shared/components/ui/item'

import type { ReaderBodyProps, ReaderHref } from '../reader.types'
import { ContentBody, ReaderLink } from './ReaderParts'

/** The documents of the project, grouped as the side panel of Documents groups them, or their state. */
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
