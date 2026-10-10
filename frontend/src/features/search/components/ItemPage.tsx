'use client'

import { featureTabGroup } from '@/components/layout/activity-bar.config'
import { useEditorTab } from '@/components/layout/hooks/useEditorTab'
import { EmptyState, ErrorState, LoadingState, NotFoundState } from '@/components/state'
import { Badge } from '@/components/ui/badge'
import { isNotFoundError } from '@/lib/api-fetch.utils'

import { useItem } from '../hooks/useItem'
import { fieldLabel, formatFieldValue, itemTitle } from '../search.utils'

interface ItemPageProps {
  projectId: string
  itemId: string
}

/** One item found by the search: its key, kind, review status, and every field of its content. */
export function ItemPage({ projectId, itemId }: ItemPageProps) {
  const item = useItem(itemId)

  useEditorTab(
    featureTabGroup(projectId, 'search'),
    item.isSuccess
      ? {
          id: itemId,
          title: item.data.key,
          href: `/projects/${encodeURIComponent(projectId)}/search/${encodeURIComponent(itemId)}`,
          icon: 'item',
        }
      : null,
  )

  if (item.isPending) return <LoadingState label="Loading the item" rows={4} />
  if (item.isError) {
    return isNotFoundError(item.error) ? (
      <NotFoundState
        title="Item not found"
        description="No item exists at this address, or it was deleted."
        reference={itemId}
      />
    ) : (
      <ErrorState message={item.error.message} onRetry={() => void item.refetch()} />
    )
  }

  const fields = Object.entries(item.data.content)
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {item.data.key}
          </Badge>
          <Badge variant="soft">{item.data.kind}</Badge>
          <Badge variant="soft">{item.data.review_status}</Badge>
        </div>
        <h1 className="text-lg font-semibold">{itemTitle(item.data)}</h1>
      </header>
      {fields.length === 0 ? (
        <EmptyState title="This item has no content" size="compact" />
      ) : (
        <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-3 text-sm">
          {fields.map(([field, value]) => (
            <div key={field} className="contents">
              <dt className="text-muted-foreground">{fieldLabel(field)}</dt>
              <dd className="whitespace-pre-line">{formatFieldValue(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  )
}
