'use client'

import type { ReactNode } from 'react'

import {
  type ContentField,
  ContentFieldValue,
  fieldText,
  itemTitle,
  summaryFields,
  useWorkflowDefinition,
} from '@/modules/workflow/entities/@x/artifact'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { textOf } from '@/shared/lib/text'

import type { OutlineItem } from '../items/items.types'
import { transcriptContentField, transcriptRoleField } from '../outline/outline.constants'
import type { DocumentBlock, KindView } from '../outline/outline.types'
import { itemAnchorId } from '../outline/outline.utils'
import { artifactViewMessages } from './artifact-view.constants'

/** Draws the title of an item as a link to its page; the page of the document gives how it opens. */
export type RenderItemLink = (item: OutlineItem, title: ReactNode) => ReactNode

interface DocumentBlocksProps {
  blocks: readonly DocumentBlock[]
  kinds: ReadonlyMap<string, KindView>
  renderItemLink: RenderItemLink
  /** The item that the address of the page names: its block is marked and scrolled to. */
  targetItemId?: string | null | undefined
}

/** The props that tie a block of one item to the address of the page. */
function anchorProps(itemId: string, targetItemId: string | null) {
  return {
    id: itemAnchorId(itemId),
    tabIndex: -1,
    ...(targetItemId === itemId ? { 'data-target': '' } : {}),
  } as const
}

type ValueDefinition = ReturnType<typeof useWorkflowDefinition>['data']

const headings = { 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5' } as const

function ItemsTable({
  items,
  view,
  renderItemLink,
  definition,
  targetItemId,
}: {
  items: readonly OutlineItem[]
  view: KindView
  renderItemLink: RenderItemLink
  definition: ValueDefinition
  targetItemId: string | null
}) {
  const fields = summaryFields(view.schema)
  const titleField = view.schema['x-ui-title-field']
  const linkedName = fields.some(({ name }) => name === titleField) ? titleField : fields[0]?.name
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">{artifactViewMessages.key}</TableHead>
          {fields.map((field) => (
            <TableHead key={field.name}>{field.title}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            className="data-[target]:bg-accent/50"
            {...anchorProps(item.id, targetItemId)}
          >
            <TableCell className="font-mono text-xs">{item.key}</TableCell>
            {fields.map((field) => (
              <TableCell key={field.name} className="align-top whitespace-normal">
                {field.name === linkedName ? (
                  renderItemLink(item, itemTitleOf(view, item, field))
                ) : (
                  <ContentFieldValue
                    field={field}
                    value={item.content[field.name]}
                    definition={definition}
                  />
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function itemTitleOf(view: KindView, item: OutlineItem, field: ContentField): ReactNode {
  return fieldText(item, field.name) ?? itemTitle(view.schema, item)
}

function ItemCards({
  items,
  view,
  renderItemLink,
  definition,
  targetItemId,
}: {
  items: readonly OutlineItem[]
  view: KindView
  renderItemLink: RenderItemLink
  definition: ValueDefinition
  targetItemId: string | null
}) {
  const fields = summaryFields(view.schema)
  const [first, ...others] = fields
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Card
          key={item.id}
          size="sm"
          className="data-[target]:bg-accent/50"
          {...anchorProps(item.id, targetItemId)}
        >
          <CardHeader>
            <CardTitle>
              {renderItemLink(
                item,
                first === undefined ? item.key : itemTitleOf(view, item, first),
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {others.map((field) => (
              <div key={field.name}>
                <ContentFieldValue
                  field={field}
                  value={item.content[field.name]}
                  definition={definition}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ItemTranscript({
  items,
  targetItemId,
}: {
  items: readonly OutlineItem[]
  targetItemId: string | null
}) {
  return (
    <ol className="max-w-prose space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="space-y-0.5 data-[target]:bg-accent/50"
          {...anchorProps(item.id, targetItemId)}
        >
          <p className="text-xs font-semibold text-muted-foreground">
            <span>{textOf(item.content[transcriptRoleField]) || item.key}</span>
          </p>
          <p className="whitespace-pre-line">{textOf(item.content[transcriptContentField])}</p>
        </li>
      ))}
    </ol>
  )
}

/** The parts of a document in order: headings of sections, headings of groups, and the items drawn by their display. */
export function DocumentBlocks({
  blocks,
  kinds,
  renderItemLink,
  targetItemId = null,
}: DocumentBlocksProps) {
  const { data: definition } = useWorkflowDefinition()
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const Heading = headings[block.level]
          return (
            <Heading
              key={`heading:${block.item.id}`}
              className="pt-2 text-lg font-semibold data-[target]:bg-accent/50"
              {...anchorProps(block.item.id, targetItemId)}
            >
              {block.title}
            </Heading>
          )
        }
        if (block.type === 'group') {
          return (
            <h2 key={`group:${block.kind}`} className="pt-2 text-lg font-semibold">
              {block.title} <span className="text-sm text-muted-foreground">({block.count})</span>
            </h2>
          )
        }
        const view = kinds.get(block.kind)
        if (view === undefined) return null
        const key = `items:${block.kind}:${String(index)}`
        if (block.display === 'cards') {
          return (
            <ItemCards
              key={key}
              items={block.items}
              view={view}
              renderItemLink={renderItemLink}
              definition={definition}
              targetItemId={targetItemId}
            />
          )
        }
        if (block.display === 'transcript') {
          return (
            <ItemTranscript key={key} items={block.items} targetItemId={targetItemId} />
          )
        }
        return (
          <ItemsTable
            key={key}
            items={block.items}
            view={view}
            renderItemLink={renderItemLink}
            definition={definition}
            targetItemId={targetItemId}
          />
        )
      })}
    </div>
  )
}
