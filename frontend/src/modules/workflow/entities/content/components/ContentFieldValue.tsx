'use client'

import { Badge } from '@/shared/components/ui/badge'
import { isEmpty, isRecord } from '@/shared/lib/guards'
import { textOf } from '@/shared/lib/text'

import type { WorkflowDefinition } from '../../definition/workflow-definition.types'
import type { ContentField, FieldWidget } from '../fields/content-fields.types'
import { useValueLabel } from '../value-labels/hooks/useValueLabel'
import { valueTitle } from '../values/content-values.utils'
import { contentValueMessages } from './content-field-value.constants'

/** What titles the values of a field that names a list of values; none until the definition loads. */
type ValueDefinition = Pick<WorkflowDefinition, 'value_lists'> | undefined

interface ContentFieldValueProps {
  field: ContentField
  value: unknown
  definition: ValueDefinition
}

function TextValue({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((paragraph, index) => (
        <p key={index} className="whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </>
  )
}

function TextsValue({ items }: { items: unknown[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((entry, index) => (
        <li key={index}>{textOf(entry)}</li>
      ))}
    </ul>
  )
}

function EntriesValue({
  field,
  items,
  definition,
}: {
  field: ContentField
  items: unknown[]
  definition: ValueDefinition
}) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((entry, index) => (
        <li key={index}>
          {isRecord(entry) ? (
            <EntryValue field={field} entry={entry} definition={definition} />
          ) : (
            textOf(entry)
          )}
        </li>
      ))}
    </ul>
  )
}

function TagsValue({
  field,
  items,
  definition,
}: {
  field: ContentField
  items: unknown[]
  definition: ValueDefinition
}) {
  return (
    <span className="flex flex-wrap gap-1">
      {items.map((tag, index) => (
        <Badge key={index} variant="soft">
          {valueTitle(field, textOf(tag), definition)}
        </Badge>
      ))}
    </span>
  )
}

function EntryValue({
  field,
  entry,
  definition,
}: {
  field: ContentField
  entry: Record<string, unknown>
  definition: ValueDefinition
}) {
  const shown = field.entryFields.filter(({ name }) => !isEmpty(entry[name]))
  return (
    <dl className="space-y-0.5">
      {shown.map((entryField) => (
        <div key={entryField.name} className="flex gap-2">
          <dt className="text-muted-foreground">{entryField.title}:</dt>
          <dd>
            <ContentFieldValue
              field={entryField}
              value={entry[entryField.name]}
              definition={definition}
            />
          </dd>
        </div>
      ))}
    </dl>
  )
}

function SelectValue({
  field,
  value,
  definition,
}: {
  field: ContentField
  value: string
  definition: ValueDefinition
}) {
  return <span>{useValueLabel(field, value, definition)}</span>
}

interface WidgetValueViewProps {
  field: ContentField
  value: unknown
  definition: ValueDefinition
}

// How each widget shows a value that is not empty. Looked up by widget instead of branched on, so
// a widget that the schema can name has its row, and TypeScript reports a widget without one.
const widgetValueViews = {
  text: ({ value }) => <TextValue text={textOf(value)} />,
  textarea: ({ value }) => <TextValue text={textOf(value)} />,
  select: ({ field, value, definition }) => (
    <SelectValue field={field} value={textOf(value)} definition={definition} />
  ),
  number: ({ value }) => <span>{textOf(value)}</span>,
  boolean: ({ value }) => (
    <span>{value === true ? contentValueMessages.yes : contentValueMessages.no}</span>
  ),
  list: ({ value }) => (Array.isArray(value) ? <TextsValue items={value} /> : null),
  tags: ({ field, value, definition }) =>
    Array.isArray(value) ? <TagsValue field={field} items={value} definition={definition} /> : null,
  'object-list': ({ field, value, definition }) =>
    Array.isArray(value) ? (
      <EntriesValue field={field} items={value} definition={definition} />
    ) : null,
} as const satisfies Record<FieldWidget, (props: WidgetValueViewProps) => React.ReactNode>

/**
 * The value of one content field, read only: a text as paragraphs, a select as the title of its
 * value, a number, yes or no, a list as a list, tags as badges, an object list as a list of its
 * entries with their own fields. Renders nothing for an empty value; the caller hides the label.
 * The caller reads the definition once, so a table of many values does not read it for each.
 */
export function ContentFieldValue({ field, value, definition }: ContentFieldValueProps) {
  if (isEmpty(value)) return null

  const View = widgetValueViews[field.widget]
  return <View field={field} value={value} definition={definition} />
}
