'use client'

import { ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { EmptyState, ErrorState, LoadingState } from '@/components/state'
import { artifactHref, itemHref } from '@/lib/routes.utils'
import { cn } from '@/lib/utils'

import type { Artifact, ContentSchema, OutlineItem } from '../artifacts.types'
import { itemTitle } from '../field-view.utils'
import { useArtifactItems } from '../hooks/useArtifactItems'
import { useArtifactKinds } from '../hooks/useArtifactKinds'
import { useProjectArtifacts } from '../hooks/useProjectArtifacts'
import { groupByKind, isNested, schemasByKind } from '../kinds.utils'

const rowClassName =
  'flex min-w-0 items-center gap-1.5 rounded-md py-1 pr-2 text-xs outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 aria-[current=page]:bg-sidebar-accent'

// How far each level of items is set in, in rem.
const INDENT_REM = 0.75

interface ArtifactTreeProps {
  projectId: string
}

/** The artifacts of a project, each opening into its sections and items. */
export function ArtifactTree({ projectId }: ArtifactTreeProps) {
  const artifacts = useProjectArtifacts(projectId)
  const kinds = useArtifactKinds()

  if (artifacts.isPending) {
    return <LoadingState label="Loading artifacts" rows={5} size="compact" className="px-3" />
  }
  if (artifacts.isError) {
    return (
      <ErrorState
        message={artifacts.error.message}
        onRetry={() => void artifacts.refetch()}
        size="compact"
        className="px-3"
      />
    )
  }
  if (artifacts.data.length === 0) {
    return <EmptyState title="No artifacts yet" size="compact" className="px-3" />
  }

  const schemas = schemasByKind(kinds.data)
  return (
    <ul aria-label="Artifacts" className="flex flex-col gap-px px-1 pb-2">
      {artifacts.data.map((artifact) => (
        <ArtifactNode
          key={artifact.id}
          projectId={projectId}
          artifact={artifact}
          schemas={schemas}
        />
      ))}
    </ul>
  )
}

interface ArtifactNodeProps {
  projectId: string
  artifact: Artifact
  schemas: Map<string, ContentSchema>
}

function ArtifactNode({ projectId, artifact, schemas }: ArtifactNodeProps) {
  const pathname = usePathname()
  const href = artifactHref(projectId, artifact.id)
  const [open, setOpen] = useState(false)
  const hasItems = artifact.item_count > 0

  return (
    <li>
      <div className="flex items-center">
        <button
          type="button"
          aria-label={`${open ? 'Close' : 'Open'} ${artifact.title}`}
          aria-expanded={open}
          disabled={!hasItems}
          onClick={() => {
            setOpen(!open)
          }}
          className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-0"
        >
          <ChevronRightIcon
            aria-hidden
            className={cn('size-3.5 transition-transform', open && 'rotate-90')}
          />
        </button>
        <Link
          href={href}
          aria-current={pathname === href ? 'page' : undefined}
          className={cn(rowClassName, 'flex-1 pl-1 font-medium text-foreground')}
        >
          <span className="truncate">{artifact.title}</span>
          <span className="ml-auto shrink-0 font-mono text-3xs font-normal text-muted-foreground">
            v{artifact.version}
          </span>
        </Link>
      </div>
      {open && <ItemTree projectId={projectId} artifactId={artifact.id} schemas={schemas} />}
    </li>
  )
}

interface ItemTreeProps {
  projectId: string
  artifactId: string
  schemas: Map<string, ContentSchema>
}

// The items under an artifact node: nested by section, or grouped by kind without sections.
function ItemTree({ projectId, artifactId, schemas }: ItemTreeProps) {
  const items = useArtifactItems(artifactId)

  if (items.isPending) {
    return <LoadingState label="Loading items" rows={3} size="compact" className="pl-6" />
  }
  if (items.isError) {
    return (
      <ErrorState
        message={items.error.message}
        onRetry={() => void items.refetch()}
        size="compact"
        className="pl-6"
      />
    )
  }

  if (isNested(items.data)) {
    return <NestedItems projectId={projectId} items={items.data} schemas={schemas} />
  }

  return (
    <div className="flex flex-col gap-1 pb-1 pl-6">
      {groupByKind(items.data).map((group) => (
        <div key={group.kind}>
          <p className="px-2 py-0.5 text-3xs font-medium tracking-wide text-muted-foreground uppercase">
            {schemas.get(group.kind)?.title ?? group.kind}
          </p>
          <ul>
            {group.items.map((item) => (
              <li key={item.id}>
                <ItemRow projectId={projectId} item={item} schema={schemas.get(item.kind)} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

interface NestedItemsProps {
  projectId: string
  items: OutlineItem[]
  schemas: Map<string, ContentSchema>
}

function NestedItems({ projectId, items, schemas }: NestedItemsProps) {
  const [closed, setClosed] = useState<Set<string>>(new Set())
  const parents = new Set(
    items.flatMap(({ parent_item_id }) => (parent_item_id === null ? [] : [parent_item_id])),
  )
  const hidden = (item: OutlineItem): boolean => {
    let parent = item.parent_item_id
    while (parent !== null) {
      if (closed.has(parent)) return true
      parent = items.find(({ id }) => id === parent)?.parent_item_id ?? null
    }
    return false
  }

  return (
    <ul className="pb-1">
      {items
        .filter((item) => !hidden(item))
        .map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${String(item.depth * INDENT_REM)}rem` }}
            className="flex items-center"
          >
            {parents.has(item.id) ? (
              <button
                type="button"
                aria-label={`${closed.has(item.id) ? 'Open' : 'Close'} ${item.key}`}
                aria-expanded={!closed.has(item.id)}
                onClick={() => {
                  setClosed((previous) => {
                    const next = new Set(previous)
                    if (next.has(item.id)) next.delete(item.id)
                    else next.add(item.id)
                    return next
                  })
                }}
                className="flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <ChevronRightIcon
                  aria-hidden
                  className={cn('size-3 transition-transform', !closed.has(item.id) && 'rotate-90')}
                />
              </button>
            ) : (
              <span className="size-4 shrink-0" />
            )}
            <ItemRow projectId={projectId} item={item} schema={schemas.get(item.kind)} />
          </li>
        ))}
    </ul>
  )
}

interface ItemRowProps {
  projectId: string
  item: OutlineItem
  schema: ContentSchema | undefined
}

function ItemRow({ projectId, item, schema }: ItemRowProps) {
  const pathname = usePathname()
  const href = itemHref(projectId, item.id)
  return (
    <Link
      href={href}
      aria-current={pathname === href ? 'page' : undefined}
      className={cn(rowClassName, 'min-w-0 flex-1 pl-2')}
    >
      <span className="shrink-0 font-mono text-2xs text-muted-foreground">
        {item.number ?? item.key}
      </span>
      <span className="truncate">{itemTitle(schema, item)}</span>
    </Link>
  )
}
