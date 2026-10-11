'use client'

import { featureTabGroup } from '@/components/layout/activity-bar.config'
import { useEditorTab } from '@/components/layout/hooks/useEditorTab'
import { EmptyState, ErrorState, LoadingState, NotFoundState } from '@/components/state'
import { Badge } from '@/components/ui/badge'
import { isNotFoundError } from '@/lib/api-fetch.utils'

import { fieldLabel, formatFieldValue, itemTitle } from '../artifacts.utils'
import { useArtifactItem } from '../hooks/useArtifactItem'

interface ArtifactItemPageProps {
  projectId: string
  artifactId: string
  itemId: string
}

/**
 * One item open from the Artifacts tree: the fields of its content, in the
 * shape of the item page of the Search tab, opened as the artifact's tab.
 */
export function ArtifactItemPage({ projectId, artifactId, itemId }: ArtifactItemPageProps) {
  const item = useArtifactItem(itemId)

  useEditorTab(featureTabGroup(projectId, 'artifacts'), {
    id: itemId,
    title: item.data ? item.data.key : 'Item',
    href: `/projects/${encodeURIComponent(projectId)}/artifacts/${encodeURIComponent(artifactId)}/${encodeURIComponent(itemId)}`,
    icon: 'item',
  })

  if (item.isPending) {
    return <LoadingState label="Loading the item" className="p-6" />
  }
  if (item.isError) {
    if (isNotFoundError(item.error)) {
      return <NotFoundState title="Item not found" description="It may have been deleted." />
    }
    return (
      <ErrorState
        message={item.error.message}
        onRetry={() => void item.refetch()}
        className="p-6"
      />
    )
  }

  const fields = Object.entries(item.data.content)

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="font-mono">
          {item.data.key}
        </Badge>
        <Badge variant="soft">{item.data.kind}</Badge>
        <Badge variant="soft">{item.data.review_status}</Badge>
      </header>
      <h1 className="text-lg font-semibold">{itemTitle(item.data)}</h1>
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
