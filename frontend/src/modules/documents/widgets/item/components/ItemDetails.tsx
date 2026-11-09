'use client'

import type { ReactNode } from 'react'

import type { ArtifactItem } from '@/modules/artifact/entities'
import {
  type ContentField,
  contentFields,
  ContentFieldValue,
  type ContentSchema,
  hasListValue,
  type ItemPageLayout,
  pageLayoutOf,
  profileFields,
  useWorkflowDefinition,
  type ValueDefinition,
} from '@/modules/workflow/entities'
import type { HighlightRange } from '@/shared/components/ui/highlight'
import { isEmpty } from '@/shared/lib/guards'

/** The fields that the body of the page draws, by the page layout of the item. */
const bodyFields = {
  fields: (schema: ContentSchema) => contentFields(schema),
  profile: (schema: ContentSchema) => profileFields(schema).body,
} as const satisfies Record<ItemPageLayout, (schema: ContentSchema) => ContentField[]>

interface ItemDetailsProps<Range extends HighlightRange = HighlightRange> {
  item: ArtifactItem
  schema: ContentSchema
  /** The quoted words of the item, by field name. */
  fieldMarks?: ReadonlyMap<string, readonly Range[]> | undefined
  /** Wraps the marked words of a field, for example in the trigger of a popover. */
  renderFieldMark?: ((range: Range, children: ReactNode) => ReactNode) | undefined
}

/** The props of the body of the fields of an item, whatever its page layout. */
interface DetailBodyProps<Range extends HighlightRange = HighlightRange> {
  item: ArtifactItem
  fields: readonly ContentField[]
  definition: ValueDefinition
  fieldMarks?: ReadonlyMap<string, readonly Range[]> | undefined
  renderFieldMark?: ((range: Range, children: ReactNode) => ReactNode) | undefined
}

/** The fields of an item, each under its label: how every page but a profile draws them. */
function FieldList<Range extends HighlightRange = HighlightRange>({
  item,
  fields,
  definition,
  fieldMarks,
  renderFieldMark,
}: DetailBodyProps<Range>) {
  return (
    <div className="max-w-190 space-y-6">
      {fields.map((field) => (
        <section key={field.name} className="space-y-1">
          <h2 className="text-sm font-semibold text-muted-foreground">{field.title}</h2>
          <div className="space-y-2">
            <ContentFieldValue
              field={field}
              value={item.content[field.name]}
              definition={definition}
              marks={fieldMarks?.get(field.name)}
              renderMark={renderFieldMark}
            />
          </div>
        </section>
      ))}
    </div>
  )
}

/** One field of the body of a profile: its title, then its value, across the page when it is not a list. */
function ProfileField<Range extends HighlightRange = HighlightRange>({
  field,
  item,
  definition,
  fieldMarks,
  renderFieldMark,
}: DetailBodyProps<Range> & { field: ContentField }) {
  return (
    <section
      data-wide={hasListValue(field) ? undefined : true}
      className="space-y-1 sm:data-wide:col-span-2"
    >
      <h2 className="text-sm font-semibold text-muted-foreground">{field.title}</h2>
      <div className="space-y-2">
        <ContentFieldValue
          field={field}
          value={item.content[field.name]}
          definition={definition}
          marks={fieldMarks?.get(field.name)}
          renderMark={renderFieldMark}
        />
      </div>
    </section>
  )
}

/** The body of the page of a profile: the fields in a grid, a list in one column and any other field across. */
function ProfileGrid<Range extends HighlightRange = HighlightRange>(props: DetailBodyProps<Range>) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {props.fields.map((field) => (
        <ProfileField key={field.name} {...props} field={field} />
      ))}
    </div>
  )
}

// What the body of the fields of an item is, by the page layout of its kind.
const detailBodies = {
  fields: FieldList,
  profile: ProfileGrid,
} as const satisfies Record<ItemPageLayout, (props: DetailBodyProps) => ReactNode>

/**
 * The fields of one item: every filled field in the order of the schema, the label above the
 * value, with the words that links quote marked. The title, the key line and the links are the
 * page's; the body follows the page layout of the kind of the item.
 */
export function ItemDetails<Range extends HighlightRange = HighlightRange>({
  item,
  schema,
  fieldMarks,
  renderFieldMark,
}: ItemDetailsProps<Range>) {
  const { data: definition } = useWorkflowDefinition()
  const fields = bodyFields[pageLayoutOf(schema)](schema).filter(
    (field) => !isEmpty(item.content[field.name]),
  )
  const Body = detailBodies[pageLayoutOf(schema)]

  return (
    <Body
      item={item}
      fields={fields}
      definition={definition}
      fieldMarks={fieldMarks}
      renderFieldMark={renderFieldMark}
    />
  )
}
