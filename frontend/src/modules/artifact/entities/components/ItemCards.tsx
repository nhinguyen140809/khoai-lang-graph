'use client'

import {
  type ContentField,
  ContentFieldValue,
  extensionField,
  summaryFields,
  type ValueDefinition,
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

import type { OutlineItem } from '../items/items.types'
import type { ItemGroup, KindView, RenderItemLink } from '../outline/outline.types'
import { groupItemsBy, itemAnchorProps, itemTitleOf } from '../outline/outline.utils'
import { artifactViewMessages } from './artifact-view.constants'

interface ItemCardsProps {
  items: readonly OutlineItem[]
  view: KindView
  renderItemLink: RenderItemLink
  definition: ValueDefinition
  targetItemId: string | null
}

/** The rows of one group of items: the first of the fields a link to the item, then the others. */
function GroupTable({
  group,
  fields,
  view,
  renderItemLink,
  definition,
  targetItemId,
}: Omit<ItemCardsProps, 'items'> & { group: ItemGroup; fields: readonly ContentField[] }) {
  const [first, ...others] = fields
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {fields.map((field) => (
            <TableHead key={field.name}>{field.title}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {group.items.map((item) => (
          <TableRow
            key={item.id}
            className="data-[target]:bg-accent/50"
            {...itemAnchorProps(item.id, targetItemId)}
          >
            {first !== undefined && (
              <TableCell className="align-top whitespace-normal">
                {renderItemLink(item, itemTitleOf(view, item, first))}
              </TableCell>
            )}
            {others.map((field) => (
              <TableCell key={field.name} className="align-top whitespace-normal">
                <ContentFieldValue
                  field={field}
                  value={item.content[field.name]}
                  definition={definition}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/**
 * The items of a kind that names `x-ui-group-by`: one card for each value of the field, headed by the value
 * and the count of its items, with one row for each item.
 */
function GroupedCards({
  items,
  groupField,
  ...props
}: ItemCardsProps & { groupField: ContentField }) {
  const fields = summaryFields(props.view.schema).filter((field) => field.name !== groupField.name)
  return (
    <div className="grid gap-3">
      {groupItemsBy(items, props.view.schema).map((group) => {
        const heading = group.value === '' ? artifactViewMessages.noGroup : group.value
        return (
          <Card key={group.value} size="sm">
            <CardHeader>
              <CardTitle>
                {heading}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  ({group.items.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GroupTable group={group} fields={fields} {...props} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/** One card for each item: its title a link, then the other fields. */
function PlainCards({ items, view, renderItemLink, definition, targetItemId }: ItemCardsProps) {
  const [first, ...others] = summaryFields(view.schema)
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

/** The items of a run as cards, in one card for each value of the field that the schema groups by when it names one. */
export function ItemCards(props: ItemCardsProps) {
  const groupField = extensionField(props.view.schema, 'x-ui-group-by')
  return groupField === undefined ? (
    <PlainCards {...props} />
  ) : (
    <GroupedCards {...props} groupField={groupField} />
  )
}
