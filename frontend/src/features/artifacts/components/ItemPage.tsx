'use client'

import { PencilIcon } from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import { useState } from 'react'

import { featureTabGroup } from '@/components/layout/activity-bar.config'
import { EditorWithPanel } from '@/components/layout/EditorWithPanel'
import { useEditorTab } from '@/components/layout/hooks/useEditorTab'
import { ErrorState, LoadingState, NotFoundState } from '@/components/state'
import { Button } from '@/components/ui/button'
import { useNow } from '@/hooks/useNow'
import { isNotFoundError } from '@/lib/api-fetch.utils'
import { formatRelativeTime } from '@/lib/relative-time.utils'

import { artifactHref, itemHref } from '../artifact-links.utils'
import { fieldViews, itemTitle } from '../field-view.utils'
import { useArtifact } from '../hooks/useArtifact'
import { useArtifactItems } from '../hooks/useArtifactItems'
import { useArtifactKinds } from '../hooks/useArtifactKinds'
import { useItem } from '../hooks/useItem'
import { useItemSchema } from '../hooks/useItemSchema'
import { ancestorsOf, schemasByKind } from '../kinds.utils'
import { FieldValue } from './FieldValue'
import { ItemForm } from './ItemForm'
import { ItemPanel } from './ItemPanel'
import { ReviewStatusBadge } from './ReviewStatusBadge'

interface ItemPageProps {
  projectId: string
  itemId: string
}

/** One item: its fields drawn by its schema, an edit form, and its trace and versions below. */
export function ItemPage({ projectId, itemId }: ItemPageProps) {
  const item = useItem(itemId)
  const { schema } = useItemSchema(item.data)
  const artifact = useArtifact(item.data?.artifact_id ?? '')
  const siblings = useArtifactItems(item.data?.artifact_id ?? '', item.isSuccess)
  const kinds = useArtifactKinds()
  const [editing, setEditing] = useState(false)
  const now = useNow()

  useEditorTab(
    featureTabGroup(projectId, 'artifacts'),
    item.isSuccess
      ? { id: itemId, title: item.data.key, href: itemHref(projectId, itemId), icon: 'item' }
      : null,
  )

  if (item.isPending) return <LoadingState label="Loading the item" rows={5} />
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
  if (schema === undefined) return <LoadingState label="Loading the schema" rows={3} />

  const schemas = schemasByKind(kinds.data)
  const views = fieldViews(schema)
  const chain = ancestorsOf(item.data, siblings.data ?? [])
  const sectionFor = (id: string) => siblings.data?.find((entry) => entry.id === id)

  return (
    <EditorWithPanel
      panelLabel="Trace and timeline"
      panel={<ItemPanel item={item.data} schema={schema} />}
    >
      <article className="mx-auto flex max-w-3xl flex-col gap-5 p-6">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
        >
          {artifact.isSuccess && (
            <Link
              href={artifactHref(projectId, artifact.data.id) as Route}
              className="rounded-sm underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {artifact.data.title}
            </Link>
          )}
          {chain.map((link) => {
            const section = sectionFor(link.id)
            return section === undefined ? null : (
              <span key={link.id} className="flex items-center gap-1">
                <span aria-hidden>/</span>
                <Link
                  href={itemHref(projectId, section.id) as Route}
                  className="rounded-sm underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {section.number !== null && `${section.number} `}
                  {itemTitle(schemas.get(section.kind), section)}
                </Link>
              </span>
            )
          })}
          <span aria-hidden>/</span>
          <span className="font-mono text-foreground">{item.data.key}</span>
        </nav>

        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">
              <span className="mr-3 font-mono text-muted-foreground">{item.data.key}</span>
              {itemTitle(schema, item.data)}
            </h1>
            <span className="font-mono text-xs text-muted-foreground">v{item.data.version}</span>
            <ReviewStatusBadge status={item.data.review_status} />
            {!editing && (
              <Button
                className="ml-auto"
                variant="outline"
                size="xs"
                onClick={() => {
                  setEditing(true)
                }}
              >
                <PencilIcon aria-hidden />
                Edit
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {item.data.updated_by.actor === 'user'
              ? 'Edited by you'
              : `Written by ${item.data.updated_by.agent_role ?? 'an agent'}`}{' '}
            <time dateTime={item.data.updated_at}>
              {formatRelativeTime(item.data.updated_at, now)}
            </time>
          </p>
        </header>

        {editing ? (
          <ItemForm
            item={item.data}
            schema={schema}
            onDone={() => {
              setEditing(false)
            }}
          />
        ) : (
          <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-3 text-sm">
            {views.map((view) => (
              <div key={view.name} className="contents">
                <dt className="text-muted-foreground">{view.label}</dt>
                <dd>
                  <FieldValue view={view} value={item.data.content[view.name]} />
                </dd>
              </div>
            ))}
          </dl>
        )}
      </article>
    </EditorWithPanel>
  )
}
