'use client'

import type { ReactNode } from 'react'

import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Highlight, type HighlightRange } from '@/shared/components/ui/highlight'
import { InitialsAvatar } from '@/shared/components/ui/initials-avatar'
import { SegmentedBar } from '@/shared/components/ui/segmented-bar'
import { isEmpty, isRecord } from '@/shared/lib/guards'
import { snakeToSentenceCase, textOf } from '@/shared/lib/text'

import type { ContentField, FieldWidget } from '../fields/content-fields.types'
import { isChoiceField } from '../fields/content-fields.utils'
import { useValueLabel } from '../value-labels/hooks/useValueLabel'
import { nonStatusTone, valueTone } from '../value-labels/value-labels.utils'
import type { ValueDefinition } from '../values/content-values.types'
import { valueTitle } from '../values/content-values.utils'
import { fieldText } from '../values/item-title.utils'
import { contentValueMessages } from './content-field-value.constants'

/** Wraps the people of an avatar list that reach the page of their item; the caller knows the addresses. */
type RenderItemIdLink = (itemId: string, children: ReactNode) => ReactNode

interface ContentFieldValueProps<Range extends HighlightRange = HighlightRange> {
  field: ContentField
  value: unknown
  definition: ValueDefinition
  /** The words of the value to mark, as ranges of its text; only a text or a textarea value is drawn with them. */
  marks?: readonly Range[] | undefined
  /** Wraps the marked words of a range, for example in the trigger of a popover; the marks become interactive. */
  renderMark?: ((range: Range, children: ReactNode) => ReactNode) | undefined
  /** Wraps the people of an avatar list that reach the page of their item, such as a link. */
  renderItemIdLink?: RenderItemIdLink | undefined
}

/**
 * A text with some of its words marked, each range in the form and the color it carries: the whole
 * text in one, so that a range may cross the lines of it.
 */
function MarkedText<Range extends HighlightRange>({
  text,
  marks,
  renderMark,
}: {
  text: string
  marks: readonly Range[]
  renderMark?: ((range: Range, children: ReactNode) => ReactNode) | undefined
}) {
  return (
    <p className="whitespace-pre-line">
      <Highlight
        ranges={marks}
        renderMark={renderMark === undefined ? undefined : (mark, range) => renderMark(range, mark)}
      >
        {text}
      </Highlight>
    </p>
  )
}

/** What the views of a list of values take: the field, its values and the definition that titles them. */
interface ListValueProps {
  field: ContentField
  items: unknown[]
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

function EntriesValue({ field, items, definition }: ListValueProps) {
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

/** What an entry of a rating list rates: a key such as `tech_comfort` reads as a sentence, other text as it is. */
function ratedLabel(label: string): string {
  return /^[a-z][a-z0-9_]*$/.test(label) ? snakeToSentenceCase(label) : label
}

/**
 * The entries of a rating list, one under the other: what is rated on the left and, on the right,
 * where the value stands in words, then a bar of the scale, and the note that says why. A list
 * whose schema names no label and value field reads as an object list.
 */
function RatingListValue({ field, items, definition }: ListValueProps) {
  const { rating } = field
  if (rating === null) return <EntriesValue field={field} items={items} definition={definition} />
  return (
    <ul className="space-y-3">
      {items.filter(isRecord).map((entry, index) => (
        <RatingEntry key={index} entry={entry} rating={rating} />
      ))}
    </ul>
  )
}

/** One entry of a rating list: what it rates and where it stands, the bar of the scale and its note. */
function RatingEntry({
  entry,
  rating,
}: {
  entry: Record<string, unknown>
  rating: NonNullable<ContentField['rating']>
}) {
  const value = entry[rating.value]
  const note = rating.note === null ? '' : textOf(entry[rating.note])
  const level =
    typeof value === 'number' ? contentValueMessages.level(value, rating.min, rating.max) : null
  return (
    <li className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-3">
        <span>{ratedLabel(textOf(entry[rating.label]))}</span>
        <span className="shrink-0 text-muted-foreground">{level?.words}</span>
      </span>
      {typeof value === 'number' && level !== null && (
        <SegmentedBar value={value} min={rating.min} max={rating.max} label={level.label} />
      )}
      {note !== '' && <span className="text-xs text-muted-foreground">{note}</span>}
    </li>
  )
}

function TagsValue({ field, items, definition }: ListValueProps) {
  return (
    <span className="flex flex-wrap gap-2">
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

/** A value of a badge field, in the tone written for the field. */
function BadgeValue({
  field,
  value,
  definition,
}: {
  field: ContentField
  value: string
  definition: ValueDefinition
}) {
  return (
    <Badge variant="soft" color={valueTone(field.path, value)}>
      {useValueLabel(field, value, definition)}
    </Badge>
  )
}

/** A list of entries, each its avatar and its name; an entry that has an item reaches its page. */
function AvatarListValue({
  entries,
  renderItemIdLink,
}: {
  entries: unknown[]
  renderItemIdLink: RenderItemIdLink | undefined
}) {
  return (
    <span className="flex flex-wrap gap-2">
      {entries.map((entry, place) => {
        if (!isRecord(entry)) return null
        const name = fieldText({ content: entry }, 'name') ?? ''
        const itemId = fieldText({ content: entry }, 'item_id')
        const person = (
          <>
            <InitialsAvatar name={name} tone={nonStatusTone(place)} size="sm" />
            <span>{name}</span>
          </>
        )
        // An entry that has an item reaches its page, as an outline button that wraps the link;
        // the others read as the same avatar and name, not focusable.
        if (itemId === null || renderItemIdLink === undefined) {
          return (
            <span key={place} className="inline-flex items-center gap-1 py-1 text-sm">
              {person}
            </span>
          )
        }
        return (
          <Button key={place} asChild variant="outline">
            {renderItemIdLink(itemId, person)}
          </Button>
        )
      })}
    </span>
  )
}

interface WidgetValueViewProps {
  field: ContentField
  value: unknown
  definition: ValueDefinition
  renderItemIdLink: RenderItemIdLink | undefined
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
  separator: ({ field, value, definition }) =>
    isChoiceField(field) ? (
      <SelectValue field={field} value={textOf(value)} definition={definition} />
    ) : (
      <span>{textOf(value)}</span>
    ),
  'avatar-list': ({ value, renderItemIdLink }) =>
    Array.isArray(value) ? (
      <AvatarListValue entries={value} renderItemIdLink={renderItemIdLink} />
    ) : null,
  badge: ({ field, value, definition }) => (
    <BadgeValue field={field} value={textOf(value)} definition={definition} />
  ),
  'rating-list': ({ field, value, definition }) =>
    Array.isArray(value) ? (
      <RatingListValue field={field} items={value} definition={definition} />
    ) : null,
} as const satisfies Record<FieldWidget, (props: WidgetValueViewProps) => React.ReactNode>

/**
 * The value of one content field, read only: a text as paragraphs, a select as the title of its
 * value, a number, yes or no, a list as a list, tags as badges, an object list as a list of its
 * entries with their own fields. Renders nothing for an empty value; the caller hides the label.
 * The caller reads the definition once, so a table of many values does not read it for each.
 */
export function ContentFieldValue<Range extends HighlightRange = HighlightRange>({
  field,
  value,
  definition,
  marks,
  renderMark,
  renderItemIdLink,
}: ContentFieldValueProps<Range>) {
  if (isEmpty(value)) return null

  if ((field.widget === 'text' || field.widget === 'textarea') && marks !== undefined) {
    return <MarkedText text={textOf(value)} marks={marks} renderMark={renderMark} />
  }
  const View = widgetValueViews[field.widget]
  return (
    <View field={field} value={value} definition={definition} renderItemIdLink={renderItemIdLink} />
  )
}
