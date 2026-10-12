'use client'

import { projectTabGroup, useEditorTab } from '@/components/layout'
import { ErrorState, LoadingState, NotFoundState } from '@/components/state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { isNotFoundError } from '@/lib/api-fetch.utils'

import { artifactHref } from '../artifact-links.utils'
import type { ContentSchema, OutlineItem } from '../artifacts.types'
import { fieldViews, formatValue, itemTitle, listFieldViews } from '../field-view.utils'
import { useArtifact } from '../hooks/useArtifact'
import { useArtifactItems } from '../hooks/useArtifactItems'
import { useArtifactKinds } from '../hooks/useArtifactKinds'
import { schemasByKind } from '../kinds.utils'
import { ExportButton } from './ExportButton'
import { FieldValue } from './FieldValue'
import { ItemLink } from './ItemLink'
import { ItemOpenContext } from './ItemOpenContext'
import { ReviewStatusBadge } from './ReviewStatusBadge'

type Block =
  | { type: 'heading'; item: OutlineItem }
  | { type: 'run'; kind: string; display: string; parent: string | null; items: OutlineItem[] }

// The items in outline order as blocks: a heading for each section, and the consecutive items of
// one kind under one parent as one table, one set of cards or one transcript.
function blocksOf(items: OutlineItem[], schemas: Map<string, ContentSchema>): Block[] {
  const blocks: Block[] = []
  for (const item of items) {
    const display = schemas.get(item.kind)?.['x-ui-display'] ?? 'table'
    if (display === 'heading') {
      blocks.push({ type: 'heading', item })
      continue
    }
    const last = blocks.at(-1)
    if (last?.type === 'run' && last.kind === item.kind && last.parent === item.parent_item_id) {
      last.items.push(item)
    } else {
      blocks.push({
        type: 'run',
        kind: item.kind,
        display,
        parent: item.parent_item_id,
        items: [item],
      })
    }
  }
  return blocks
}

interface ArtifactDocumentProps {
  projectId: string
  artifactId: string
  /** Drawn inside another view: no tab of its own, no export button. */
  embedded?: boolean
  /** Marks, with an `M`, the items that the user changed since an agent wrote them. */
  markEdited?: boolean
  /** Called with an item when it is clicked, instead of leaving for the page of the item. */
  onOpenItem?: (itemId: string) => void
}

/** An artifact as one document: its own fields, then its items drawn by the display of their kind. */
export function ArtifactDocument({
  projectId,
  artifactId,
  embedded = false,
  markEdited = false,
  onOpenItem,
}: ArtifactDocumentProps) {
  const artifact = useArtifact(artifactId)
  const items = useArtifactItems(artifactId)
  const kinds = useArtifactKinds()
  const schemas = schemasByKind(kinds.data)

  useEditorTab(
    projectTabGroup(projectId),
    artifact.isSuccess && !embedded
      ? {
          id: artifactId,
          title: artifact.data.title,
          href: artifactHref(projectId, artifactId),
          icon: 'artifact',
        }
      : null,
  )

  if (artifact.isPending) return <LoadingState label="Loading the artifact" rows={5} />
  if (artifact.isError) {
    return isNotFoundError(artifact.error) ? (
      <NotFoundState
        title="Artifact not found"
        description="No artifact exists at this address."
        reference={artifactId}
      />
    ) : (
      <ErrorState message={artifact.error.message} onRetry={() => void artifact.refetch()} />
    )
  }

  const schema = schemas.get(artifact.data.kind)
  const fields = schema === undefined ? [] : fieldViews(schema)
  return (
    <ItemOpenContext.Provider value={onOpenItem ?? null}>
      <article className="mx-auto flex max-w-4xl flex-col gap-5 p-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{artifact.data.title}</h1>
            <span className="font-mono text-xs text-muted-foreground">
              v{artifact.data.version}
            </span>
            <ReviewStatusBadge status={artifact.data.review_status} />
            {!embedded && (
              <div className="ml-auto">
                <ExportButton projectId={projectId} />
              </div>
            )}
          </div>
          {artifact.data.summary !== null && (
            <p className="text-sm text-muted-foreground">{artifact.data.summary}</p>
          )}
        </header>

        {fields.length > 0 && (
          <dl className="flex flex-col gap-y-3 text-sm">
            {fields.map((field) => (
              <div key={field.name} className="flex gap-x-4">
                <dt className="w-40 shrink-0 text-muted-foreground">{field.label}</dt>
                <dd className="min-w-0 flex-1">
                  <FieldValue view={field} value={artifact.data.content[field.name]} />
                </dd>
              </div>
            ))}
          </dl>
        )}

        {items.isPending && <LoadingState label="Loading the items" rows={4} className="p-0" />}
        {items.isError && (
          <ErrorState
            message={items.error.message}
            onRetry={() => void items.refetch()}
            size="compact"
          />
        )}
        {items.isSuccess &&
          blocksOf(items.data, schemas).map((block) =>
            block.type === 'heading' ? (
              <Heading
                key={block.item.id}
                projectId={projectId}
                item={block.item}
                schema={schemas.get(block.item.kind)}
              />
            ) : (
              <ItemRun
                key={block.items[0]?.id}
                projectId={projectId}
                block={block}
                markEdited={markEdited}
                schema={schemas.get(block.kind)}
              />
            ),
          )}
      </article>
    </ItemOpenContext.Provider>
  )
}

interface HeadingProps {
  projectId: string
  item: OutlineItem
  schema: ContentSchema | undefined
}

function Heading({ projectId, item, schema }: HeadingProps) {
  const introduction = item.content.introduction
  const level = Math.min(item.depth + 1, 5)
  const Tag = `h${String(level)}` as 'h2'
  return (
    <section className="flex flex-col gap-1 pt-2">
      <Tag className={level <= 2 ? 'text-base font-semibold' : 'text-sm font-semibold'}>
        {item.number !== null && (
          <>
            <span className="mr-3 font-mono text-muted-foreground">{item.number}</span>{' '}
          </>
        )}
        <ItemLink
          projectId={projectId}
          itemId={item.id}
          className="text-foreground no-underline hover:underline"
        >
          {itemTitle(schema, item)}
        </ItemLink>
      </Tag>
      {typeof introduction === 'string' && introduction !== '' && (
        <p className="text-sm text-muted-foreground">{introduction}</p>
      )}
    </section>
  )
}

interface ItemRunProps {
  projectId: string
  markEdited: boolean
  block: Extract<Block, { type: 'run' }>
  schema: ContentSchema | undefined
}

function ItemRun({ projectId, markEdited, block, schema }: ItemRunProps) {
  if (schema === undefined) return null
  const edited = (item: OutlineItem) =>
    markEdited && item.updated_by.actor === 'user' && item.version > 1
  const columns = listFieldViews(schema)
  const titleName = schema['x-ui-title-field']

  if (block.display === 'transcript') {
    return (
      <ol aria-label={schema.title} className="flex flex-col gap-1 font-mono text-xs">
        {block.items.map((item) => (
          <li key={item.id} className="flex gap-2">
            <ItemLink projectId={projectId} itemId={item.id} className="w-12 shrink-0">
              #{formatValue(item.content.turn)}
            </ItemLink>
            <span className="w-24 shrink-0 text-muted-foreground">
              {formatValue(item.content.role)}
            </span>
            <span className="min-w-0 flex-1 whitespace-pre-wrap">
              {formatValue(item.content.content)}
            </span>
          </li>
        ))}
      </ol>
    )
  }

  if (block.display === 'cards') {
    return (
      <ul aria-label={schema.title} className="grid gap-3 sm:grid-cols-2">
        {block.items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
            <p className="flex items-baseline gap-2 font-medium">
              <span className="font-mono text-xs text-muted-foreground">
                {edited(item) && (
                  <abbr title="Edited by you" className="mr-1 text-warning-strong no-underline">
                    M
                  </abbr>
                )}
                {item.key}
              </span>
              <ItemLink projectId={projectId} itemId={item.id}>
                {itemTitle(schema, item)}
              </ItemLink>
            </p>
            <dl className="flex flex-col gap-y-1 text-xs">
              {columns
                .filter((column) => column.name !== titleName)
                .map((column) => (
                  <div key={column.name} className="flex gap-x-2">
                    <dt className="w-28 shrink-0 text-muted-foreground">{column.label}</dt>
                    <dd className="min-w-0 flex-1">{formatValue(item.content[column.name])}</dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-24">Key</TableHead>
          {columns.map((column) => (
            <TableHead key={column.name}>{column.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {block.items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {edited(item) && (
                <abbr title="Edited by you" className="mr-1 text-warning-strong no-underline">
                  M
                </abbr>
              )}
              {item.key}
            </TableCell>
            {columns.map((column) => (
              <TableCell key={column.name} className="max-w-md whitespace-normal">
                {column.name === titleName ? (
                  <ItemLink projectId={projectId} itemId={item.id}>
                    {itemTitle(schema, item)}
                  </ItemLink>
                ) : (
                  formatValue(item.content[column.name])
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
