'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { ErrorState, LoadingState } from '@/components/state'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNow } from '@/hooks/useNow'
import { formatRelativeTime } from '@/lib/relative-time.utils'

import type { ArtifactItem, ContentSchema, Revision, TraceNode } from '../artifacts.types'
import { changedFields, fieldViews, formatValue, itemTitle } from '../field-view.utils'
import { useArtifactKinds } from '../hooks/useArtifactKinds'
import { useDefinitionSummary } from '../hooks/useDefinitionSummary'
import { useRestoreItem } from '../hooks/useItemMutations'
import { useItemRevisions } from '../hooks/useItemRevisions'
import { useItemTrace } from '../hooks/useItemTrace'
import { schemasByKind } from '../kinds.utils'
import { ItemLink } from './ItemLink'

interface ItemPanelProps {
  item: ArtifactItem
  schema: ContentSchema
}

/** Under the editor: the links of the item (TRACE) and the versions of the item (TIMELINE). */
export function ItemPanel({ item, schema }: ItemPanelProps) {
  return (
    <Tabs defaultValue="trace" className="h-full gap-0">
      <TabsList variant="line" className="px-3">
        <TabsTrigger value="trace">Trace</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
      </TabsList>
      <TabsContent value="trace" className="overflow-auto px-3 pb-3">
        <TraceTab item={item} />
      </TabsContent>
      <TabsContent value="timeline" className="overflow-auto px-3 pb-3">
        <TimelineTab item={item} schema={schema} />
      </TabsContent>
    </Tabs>
  )
}

function TraceTab({ item }: { item: ArtifactItem }) {
  const trace = useItemTrace(item.id)
  const definition = useDefinitionSummary()
  const kinds = useArtifactKinds()

  if (trace.isPending) return <LoadingState label="Loading the trace" rows={3} size="compact" />
  if (trace.isError) {
    return (
      <ErrorState
        message={trace.error.message}
        onRetry={() => void trace.refetch()}
        size="compact"
      />
    )
  }

  const schemas = schemasByKind(kinds.data)
  const nodes = new Map(trace.data.nodes.map((node) => [node.id, node]))
  const labelOf = (type: string) =>
    definition.data?.link_types.find(({ key }) => key === type)?.label ?? type
  const outgoing = trace.data.links.filter(({ source_item_id }) => source_item_id === item.id)
  const incoming = trace.data.links.filter(({ target_item_id }) => target_item_id === item.id)

  if (outgoing.length === 0 && incoming.length === 0) {
    return <p className="py-2 text-xs text-muted-foreground">This item has no links.</p>
  }

  const row = (linkId: string, label: string, node: TraceNode | undefined, stale: number | null) =>
    node === undefined ? null : (
      <li key={linkId} className="grid grid-cols-[8rem_5rem_1fr_auto] items-baseline gap-2 py-0.5">
        <span className="text-muted-foreground">{label}</span>
        <ItemLink projectId={item.project_id} itemId={node.id} className="font-mono">
          {node.key}
        </ItemLink>
        <span className="truncate">{itemTitle(schemas.get(node.kind), node)}</span>
        {stale !== null && (
          <span
            className="text-warning-strong"
            title={`Made from version ${String(stale)}; now version ${String(node.version)}`}
          >
            ! made from v{stale}
          </span>
        )}
      </li>
    )

  return (
    <div className="flex flex-col gap-3 py-2 text-xs">
      {outgoing.length > 0 && (
        <section>
          <h3 className="mb-1 font-medium">Outgoing</h3>
          <ul aria-label="Outgoing links">
            {outgoing.map((link) => {
              const target = nodes.get(link.target_item_id)
              return row(
                link.id,
                labelOf(link.link_type),
                target,
                target !== undefined && link.target_version < target.version
                  ? link.target_version
                  : null,
              )
            })}
          </ul>
        </section>
      )}
      {incoming.length > 0 && (
        <section>
          <h3 className="mb-1 font-medium">Incoming</h3>
          <ul aria-label="Incoming links">
            {incoming.map((link) =>
              row(
                link.id,
                labelOf(link.link_type),
                nodes.get(link.source_item_id),
                link.target_version < item.version ? link.target_version : null,
              ),
            )}
          </ul>
        </section>
      )}
    </div>
  )
}

const reasonText = {
  generated: 'created by',
  user_edit: 'edited by',
  rework: 'reworked by',
  restored: 'restored by',
  deleted: 'deleted by',
} as const

function who(revision: Revision): string {
  return revision.changed_by.actor === 'user'
    ? 'you'
    : (revision.changed_by.agent_role ?? 'an agent')
}

function TimelineTab({ item, schema }: { item: ArtifactItem; schema: ContentSchema }) {
  const revisions = useItemRevisions(item.id)
  const restore = useRestoreItem(item)
  const now = useNow()
  const [compared, setCompared] = useState<number | null>(null)

  if (revisions.isPending)
    return <LoadingState label="Loading the versions" rows={3} size="compact" />
  if (revisions.isError) {
    return (
      <ErrorState
        message={revisions.error.message}
        onRetry={() => void revisions.refetch()}
        size="compact"
      />
    )
  }

  const views = fieldViews(schema)
  return (
    <ol aria-label="Versions" className="flex flex-col py-2 text-xs">
      {revisions.data.map((revision, index) => {
        const previous = revisions.data[index + 1]
        const changed =
          previous === undefined ? [] : changedFields(views, previous.content, revision.content)
        return (
          <li
            key={revision.version}
            className="flex flex-col gap-1 border-b py-1.5 last:border-b-0"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono font-medium">v{revision.version}</span>
              <span>
                {reasonText[revision.change_reason]} {who(revision)}
              </span>
              <time dateTime={revision.created_at} className="text-muted-foreground">
                {formatRelativeTime(revision.created_at, now)}
              </time>
              {revision.version === item.version && (
                <span className="text-muted-foreground">current</span>
              )}
              <span className="ml-auto flex gap-1">
                {previous !== undefined && (
                  <Button
                    variant="ghost"
                    size="xs"
                    aria-expanded={compared === revision.version}
                    onClick={() => {
                      setCompared(compared === revision.version ? null : revision.version)
                    }}
                  >
                    Compare with v{previous.version}
                  </Button>
                )}
                {revision.version !== item.version && (
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={restore.isPending}
                    onClick={() => {
                      restore.mutate(revision.version, {
                        onError: (error) => {
                          toast.error(error.message)
                        },
                      })
                    }}
                  >
                    Restore
                  </Button>
                )}
              </span>
            </div>
            {compared === revision.version && previous !== undefined && (
              <div className="rounded-md border bg-muted/30 p-2">
                {changed.length === 0 ? (
                  <p className="text-muted-foreground">No field changed.</p>
                ) : (
                  <dl className="grid grid-cols-[8rem_1fr_1fr] gap-x-3 gap-y-1">
                    {changed.map((name) => (
                      <div key={name} className="contents">
                        <dt className="text-muted-foreground">
                          {views.find((view) => view.name === name)?.label ?? name}
                        </dt>
                        <dd className="text-destructive-strong line-through">
                          {formatValue(previous.content[name])}
                        </dd>
                        <dd className="text-success-strong">
                          {formatValue(revision.content[name])}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
