'use client'

import type { ReactNode } from 'react'

import {
  type ContentField,
  ContentFieldValue,
  fieldText,
  type ItemDisplay,
  itemTitle,
  summaryFields,
  useWorkflowDefinition,
  type ValueDefinition,
} from '@/modules/workflow/entities/@x/artifact'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import type { HighlightRange } from '@/shared/components/ui/highlight'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

import type { OutlineItem } from '../items/items.types'
import type { DocumentBlock, KindView, Participant, RenderItemLink } from '../outline/outline.types'
import { itemAnchorProps } from '../outline/outline.utils'
import { artifactViewMessages } from './artifact-view.constants'
import { ItemAvatarCards } from './ItemAvatarCards'
import { ItemTranscript } from './ItemTranscript'

interface DocumentBlocksProps<Range extends HighlightRange = HighlightRange> {
  blocks: readonly DocumentBlock[]
  kinds: ReadonlyMap<string, KindView>
  /** The people of the conversation of a transcript; empty for a document that holds none. */
  participants?: readonly Participant[] | undefined
  renderItemLink: RenderItemLink
  /** The item that the address of the page names: its block is marked and scrolled to. */
  targetItemId?: string | null | undefined
  /** The quoted words of each message of a transcript, by message id. */
  messageMarks?: ReadonlyMap<string, readonly Range[]> | undefined
  /** Wraps the marked words of a message, for example in the trigger of a popover. */
  renderMessageMark?: ((range: Range, children: ReactNode) => ReactNode) | undefined
}

/** The props that every view of a run of items takes; each view reads the ones it needs. */
interface RunViewProps<Range extends HighlightRange = HighlightRange> {
  items: readonly OutlineItem[]
  view: KindView
  participants: readonly Participant[]
  renderItemLink: RenderItemLink
  definition: ValueDefinition
  targetItemId: string | null
  messageMarks?: ReadonlyMap<string, readonly Range[]> | undefined
  renderMessageMark?: ((range: Range, children: ReactNode) => ReactNode) | undefined
}

const headings = { 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5' } as const

// The size of a section heading by its level: the top level one step above the body text, the
// levels nested under it at the size of the body, set apart by their weight alone.
const headingSizes = { 2: 'text-lg', 3: 'text-base', 4: 'text-base', 5: 'text-base' } as const

function itemTitleOf(view: KindView, item: OutlineItem, field: ContentField): ReactNode {
  return fieldText(item, field.name) ?? itemTitle(view.schema, item)
}

function ItemsTable<Range extends HighlightRange = HighlightRange>({
  items,
  view,
  renderItemLink,
  definition,
  targetItemId,
}: RunViewProps<Range>) {
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
            {...itemAnchorProps(item.id, targetItemId)}
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

function ItemCards<Range extends HighlightRange = HighlightRange>({
  items,
  view,
  renderItemLink,
  definition,
  targetItemId,
}: RunViewProps<Range>) {
  const fields = summaryFields(view.schema)
  const [first, ...others] = fields
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Card
          key={item.id}
          size="sm"
          className="data-[target]:bg-accent/50"
          {...itemAnchorProps(item.id, targetItemId)}
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

/** The view of a run of items of one kind, whatever the width of the marks it draws. */
type RunView = <Range extends HighlightRange>(props: RunViewProps<Range>) => ReactNode

// The view of a run of items, by the display of its kind. Each view takes the props that
// DocumentBlocks has for a run and reads the ones it needs; `heading` items are drawn as the
// heading of a section, before the runs.
const itemRunViews: Record<Exclude<ItemDisplay, 'heading'>, RunView> = {
  table: ItemsTable,
  cards: ItemCards,
  transcript: ItemTranscript,
  profile: ItemAvatarCards,
}

/** The parts of a document in order: headings of sections, headings of groups, and the items drawn by their display. */
export function DocumentBlocks<Range extends HighlightRange = HighlightRange>({
  blocks,
  kinds,
  participants = [],
  renderItemLink,
  targetItemId = null,
  messageMarks,
  renderMessageMark,
}: DocumentBlocksProps<Range>) {
  const { data: definition } = useWorkflowDefinition()
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const Heading = headings[block.level]
          return (
            <Heading
              key={`heading:${block.item.id}`}
              className={`pt-2 font-semibold data-[target]:bg-accent/50 ${headingSizes[block.level]}`}
              {...itemAnchorProps(block.item.id, targetItemId)}
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
        const RunView = itemRunViews[block.display]
        return (
          <RunView
            key={`items:${block.kind}:${String(index)}`}
            items={block.items}
            view={view}
            participants={participants}
            renderItemLink={renderItemLink}
            definition={definition}
            targetItemId={targetItemId}
            messageMarks={messageMarks}
            renderMessageMark={renderMessageMark}
          />
        )
      })}
    </div>
  )
}
