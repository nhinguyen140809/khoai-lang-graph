'use client'

import { ArrowLeftIcon, PencilIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { isNotFoundError } from '@/shared/api/api-error.utils'
import {
  BottomPanelSections,
  EditorWithBottomPanel,
  projectTabGroup,
  useEditorTab,
} from '@/shared/components/frame'
import { ErrorState, LoadingState, NotFoundState } from '@/shared/components/state'
import { Button } from '@/shared/components/ui/button'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { routes } from '@/shared/config/routes'
import { useNow } from '@/shared/hooks/useNow'
import { formatRelativeTime } from '@/shared/lib/relative-time.utils'

import { ArtifactTabIcon } from '../artifacts-frame.config'
import { fieldViews, itemTitle } from '../field-view.utils'
import { useArtifact } from '../hooks/useArtifact'
import { useArtifactItems } from '../hooks/useArtifactItems'
import { useArtifactKinds } from '../hooks/useArtifactKinds'
import { useItem } from '../hooks/useItem'
import { useItemSchema } from '../hooks/useItemSchema'
import { ancestorsOf, schemasByKind } from '../kinds.utils'
import { FieldValue } from './FieldValue'
import { ItemForm } from './ItemForm'
import { itemPanelSections } from './ItemPanel'
import { ReviewStatusBadge } from './ReviewStatusBadge'

interface ItemPageProps {
  projectId: string
  itemId: string
  /** Drawn inside another view: no tab, and a button back instead of the breadcrumb. */
  embedded?: boolean
  onBack?: () => void
}

/** One item: its fields drawn by its schema, an edit form, and its trace and versions below. */
export function ItemPage({ projectId, itemId, embedded = false, onBack }: ItemPageProps) {
  const item = useItem(itemId)
  const { schema } = useItemSchema(item.data)
  const artifact = useArtifact(item.data?.artifact_id ?? '')
  const siblings = useArtifactItems(item.data?.artifact_id ?? '', item.isSuccess)
  const kinds = useArtifactKinds()
  const [editing, setEditing] = useState(false)
  const now = useNow()

  useEditorTab(
    projectTabGroup(projectId),
    item.isSuccess && !embedded
      ? {
          id: itemId,
          title: item.data.key,
          href: routes.project(projectId).item(itemId),
          icon: ArtifactTabIcon.Item,
        }
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

  const article = (
    <article className="mx-auto flex max-w-3xl flex-col gap-5 p-6">
      {embedded ? (
        <Button variant="ghost" size="xs" className="self-start" onClick={onBack}>
          <ArrowLeftIcon aria-hidden />
          Back to {artifact.data?.title ?? 'the artifact'}
        </Button>
      ) : (
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
        >
          {artifact.isSuccess && (
            <Link
              href={routes.project(projectId).artifact(artifact.data.id)}
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
                  href={routes.project(projectId).item(section.id)}
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
      )}

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
        <dl className="flex flex-col gap-y-3 text-sm">
          {views.map((view) => (
            <div key={view.name} className="flex gap-x-4">
              <dt className="w-40 shrink-0 text-muted-foreground">{view.label}</dt>
              <dd className="min-w-0 flex-1">
                <FieldValue view={view} value={item.data.content[view.name]} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  )

  if (embedded) {
    return (
      <div className="flex flex-col">
        {article}
        <div className="h-72 border-t">
          <BottomPanelSections sections={itemPanelSections(item.data, schema)} />
        </div>
      </div>
    )
  }

  return (
    <EditorWithBottomPanel
      panelLabel="Trace and timeline"
      sections={itemPanelSections(item.data, schema)}
    >
      <ScrollArea className="h-full">{article}</ScrollArea>
    </EditorWithBottomPanel>
  )
}
