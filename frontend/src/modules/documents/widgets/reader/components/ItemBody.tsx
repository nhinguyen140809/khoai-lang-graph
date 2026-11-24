'use client'

import {
  type ArtifactItem,
  type ItemStatus,
  useItem,
  useItemStatusLook,
} from '@/modules/artifact/entities'
import { ItemDetails, ItemHeading, ItemLinkLine, ItemRelated } from '@/modules/documents/entities'
import { InlineFieldValues, useWorkflowDefinition } from '@/modules/workflow/entities'
import { isNotFoundError } from '@/shared/api/error'
import { faceSpecOf } from '@/shared/components/face'
import { ErrorState, LoadingState, NotFoundState } from '@/shared/components/state'
import { ColoredText } from '@/shared/components/ui/colored-text'

import { useReaderItem } from '../hooks/useReaderItem'
import { readerMessages } from '../reader.constants'
import type { ReaderBodyProps, RenderReaderTitle } from '../reader.types'
import { ContentBody } from './ReaderParts'

/** An item, its load, or why it does not show. */
export function ItemBody({ projectId, view, renderTitle }: ReaderBodyProps<'item'>) {
  const { itemId } = view
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

/** An item: the title of its kind, its title and its status, then its fields as the page of the item lays them out, without the ones that its schema hides. */
function LoadedItem({
  projectId,
  record,
  renderTitle,
}: {
  projectId: string
  record: ArtifactItem
  renderTitle: RenderReaderTitle
}) {
  const item = useReaderItem(projectId, record)

  const hasAvatar = item.view?.hasAvatar === true

  return (
    <ContentBody title={item.title} renderTitle={renderTitle}>
      <article className="space-y-6 p-6">
        <header className="space-y-1">
          <p className="text-sm text-muted-foreground">{item.kindTitle}</p>
          <ItemHeading
            hasAvatar={hasAvatar}
            title={item.title}
            place={item.place}
            faceSeed={record.key}
            face={faceSpecOf(record.content.face)}
          >
            {hasAvatar && <ProfileKeyLine record={record} item={item} />}
          </ItemHeading>
          {!hasAvatar && item.status !== undefined && (
            <ItemStatusLine status={item.status} isUnderReview={item.isUnderReview} />
          )}
        </header>
        {item.view !== undefined && (
          <ItemDetails
            item={record}
            layout={item.view.layout}
            fields={item.view.bodyFields}
            sections={item.view.sections}
          />
        )}
        {hasAvatar && item.links.state === 'success' && item.links.count > 0 && (
          <ItemRelated>
            <ItemLinkLine projectId={projectId} links={item.links} />
          </ItemRelated>
        )}
      </article>
    </ContentBody>
  )
}

/** The key line of a profile in the reader: the fields of its role, then its status, and no more. */
function ProfileKeyLine({
  record,
  item,
}: {
  record: ArtifactItem
  item: ReturnType<typeof useReaderItem>
}) {
  const { data: definition } = useWorkflowDefinition()
  const fields = item.view?.keyLineFields ?? []

  return (
    <div className="space-y-0.5">
      {fields.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <InlineFieldValues fields={fields} content={record.content} definition={definition} />
        </p>
      )}
      {item.status !== undefined && (
        <ItemStatusLine status={item.status} isUnderReview={item.isUnderReview} />
      )}
    </div>
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
