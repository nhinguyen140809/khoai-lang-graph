'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { useState } from 'react'

import { featureTabGroup } from '@/components/layout/activity-bar.config'
import { useEditorTab } from '@/components/layout/hooks/useEditorTab'
import { EmptyState, ErrorState, LoadingState, NotFoundState } from '@/components/state'
import { Badge } from '@/components/ui/badge'
import { isNotFoundError } from '@/lib/api-fetch.utils'

import { fieldLabel, formatFieldValue, itemTitle } from '../artifacts.utils'
import { useArtifactItem } from '../hooks/useArtifactItem'
import { ItemTimelinePanel, ItemTracePanel } from './ItemTracePanels'

interface ArtifactItemPageProps {
  projectId: string
  artifactId: string
  itemId: string
}

/**
 * One item open from the Artifacts tree. Its fields print in
 * `x-ui-field-order`; Edit turns them into inputs and saving sends PATCH
 * /items/{id} with If-Match. The bottom panel lists the trace of the item
 * and its timeline (skeletons §5).
 */
export function ArtifactItemPage({ projectId, artifactId, itemId }: ArtifactItemPageProps) {
  const item = useArtifactItem(itemId)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null)
  const [savingError, setSavingError] = useState<string | null>(null)
  const [selectedPanel, setSelectedPanel] = useState<'trace' | 'timeline'>('trace')

  useEditorTab(featureTabGroup(projectId, 'artifacts'), {
    id: itemId,
    title: item.data ? item.data.key : 'Item',
    href: `/projects/${encodeURIComponent(projectId)}/artifacts/${encodeURIComponent(artifactId)}/${encodeURIComponent(itemId)}` as Route,
    icon: 'item',
  })

  async function save() {
    if (draft === null) return
    try {
      const response = await fetch(`/api/v1/items/${encodeURIComponent(itemId)}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'if-match': item.data ? String(item.data.version) : '',
        },
        body: JSON.stringify({ content: draft }),
      })
      if (response.status === 409) {
        setSavingError('The item changed since you read it (version conflict).')
        return
      }
      if (!response.ok) {
        setSavingError('The item could not be saved.')
        return
      }
      setSavingError(null)
      setEditing(false)
      setDraft(null)
      void item.refetch()
    } catch {
      setSavingError('The item could not be saved.')
    }
  }

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
    <article className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
        <nav
          className="flex items-center gap-1 text-xs text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link
            href={`/projects/${encodeURIComponent(projectId)}/artifacts/${encodeURIComponent(artifactId)}`}
            className="underline underline-offset-2"
          >
            artifact
          </Link>
          <span aria-hidden>/</span>
          <span className="font-mono">{item.data.key}</span>
        </nav>
        <header className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {item.data.key}
          </Badge>
          <Badge variant="soft">{item.data.kind}</Badge>
          <Badge variant="soft">{item.data.review_status}</Badge>
          <Badge variant="outline" className="font-mono">
            v{String(item.data.version)}
          </Badge>
          <button
            type="button"
            onClick={() => {
              setEditing(true)
              setDraft({ ...item.data.content })
            }}
            className="ml-auto rounded-sm px-2 py-0.5 text-xs underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Edit
          </button>
        </header>
        <h1 className="text-lg font-semibold">{itemTitle(item.data)}</h1>
        {savingError !== null ? (
          <p role="alert" className="text-sm text-destructive-strong">
            {savingError}
          </p>
        ) : null}
        {editing ? (
          <div className="flex flex-col gap-3">
            {fields.map(([field, value]) => (
              <label key={field} className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground">{fieldLabel(field)}</span>
                <textarea
                  className="min-h-16 rounded-md border bg-background px-2 py-1 font-mono text-xs"
                  value={
                    typeof (draft?.[field] ?? value) === 'string'
                      ? String(draft?.[field] ?? value)
                      : JSON.stringify(draft?.[field] ?? value ?? null)
                  }
                  onChange={(event) => {
                    const text = event.target.value
                    try {
                      const parsed: unknown = JSON.parse(text)
                      setDraft({ ...(draft ?? {}), [field]: parsed })
                    } catch {
                      setDraft({ ...(draft ?? {}), [field]: text })
                    }
                  }}
                />
              </label>
            ))}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void save()}
                className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setDraft(null)
                }}
                className="rounded-md px-3 py-1 text-xs underline underline-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : fields.length === 0 ? (
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
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 border-t px-6 py-3">
        <div className="flex items-center gap-3 text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
          <button
            type="button"
            onClick={() => {
              setSelectedPanel('trace')
            }}
            aria-pressed={selectedPanel === 'trace'}
            className={selectedPanel === 'trace' ? 'text-foreground' : 'text-muted-foreground'}
          >
            Trace
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedPanel('timeline')
            }}
            aria-pressed={selectedPanel === 'timeline'}
            className={selectedPanel === 'timeline' ? 'text-foreground' : 'text-muted-foreground'}
          >
            Timeline
          </button>
        </div>
        <div className="max-h-64 overflow-auto rounded-md">
          {selectedPanel === 'trace' ? (
            <ItemTracePanel itemId={item.data.id} projectId={projectId} />
          ) : (
            <ItemTimelinePanel itemId={item.data.id} />
          )}
        </div>
      </div>
    </article>
  )
}
