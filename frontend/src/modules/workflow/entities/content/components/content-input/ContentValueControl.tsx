'use client'

import { useId } from 'react'
import type { ControllerRenderProps } from 'react-hook-form'

import type { FieldControlProps } from '@/shared/components/form'
import { NumberInput } from '@/shared/components/form/number'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Field, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/shared/components/ui/native-select'
import { Switch } from '@/shared/components/ui/switch'
import { Textarea } from '@/shared/components/ui/textarea'
import { isString } from '@/shared/lib/guards'

import type { ContentField } from '../../fields/content-fields.types'
import { isChoiceField, isNumberField } from '../../fields/content-fields.utils'
import { useValueLabelOf } from '../../value-labels/hooks/useValueLabelOf'
import type { ValueDefinition } from '../../values/content-values.types'
import { contentInputMessages } from './content-input.constants'
import { EntriesControl } from './EntriesControl'

interface ContentValueControlProps {
  field: ContentField
  value: unknown
  onChange: (value: unknown) => void
  /** The values that a field with `x-value-from` may take, read by the form from the artifacts of the project. */
  allowedValues?: readonly string[] | undefined
  /** Titles the values of a field that names a value list; none until the definition loads. */
  definition: ValueDefinition
  /** The id and `aria-invalid` that the label and the error of the field give the control. */
  controlProps?: FieldControlProps | undefined
  /** The name and the blur of the field in the form around the control, which tie it to its value. */
  formField?: Pick<ControllerRenderProps, 'name' | 'onBlur'> | undefined
  /** The element of the control, for the form to focus it. */
  controlRef?: ((instance: HTMLElement | null) => void) | undefined
}

function TextControl({
  value,
  onChange,
  controlProps,
  formField,
  controlRef,
}: ContentValueControlProps) {
  return (
    <Input
      {...controlProps}
      {...formField}
      ref={controlRef}
      value={isString(value) ? value : ''}
      onChange={(event) => {
        onChange(event.target.value)
      }}
    />
  )
}

function TextareaControl({
  value,
  onChange,
  controlProps,
  formField,
  controlRef,
}: ContentValueControlProps) {
  return (
    <Textarea
      {...controlProps}
      {...formField}
      ref={controlRef}
      className="field-sizing-content min-h-16"
      value={isString(value) ? value : ''}
      onChange={(event) => {
        onChange(event.target.value)
      }}
    />
  )
}

function SelectControl({
  field,
  value,
  onChange,
  allowedValues,
  definition,
  controlProps,
}: ContentValueControlProps) {
  const labelOf = useValueLabelOf(field, definition)
  const options = field.allowedValuesFrom !== null ? (allowedValues ?? []) : field.options
  const chosen = isString(value) ? value : null
  return (
    <NativeSelect
      {...controlProps}
      value={chosen ?? ''}
      onChange={(event) => {
        onChange(event.target.value === '' && field.nullable ? null : event.target.value)
      }}
    >
      {field.nullable ? (
        <NativeSelectOption value="">{contentInputMessages.none}</NativeSelectOption>
      ) : chosen === null ? (
        <NativeSelectOption value="" disabled>
          {contentInputMessages.chooseValue}
        </NativeSelectOption>
      ) : null}
      {options.map((option) => (
        <NativeSelectOption key={option} value={option}>
          {labelOf(option)}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}

function NumberControl({ field, value, onChange, controlProps }: ContentValueControlProps) {
  return (
    <NumberInput
      {...controlProps}
      value={typeof value === 'number' ? value : null}
      onValueChange={onChange}
      min={field.minimum ?? undefined}
      max={field.maximum ?? undefined}
      integer={field.integer}
    />
  )
}

function BooleanControl({ value, onChange, controlProps }: ContentValueControlProps) {
  return <Switch {...controlProps} checked={value === true} onCheckedChange={onChange} />
}

// The tags that take their values from a field of another artifact: one checkbox per value. The
// form names the group with a legend, so no control carries the id of a label.
function TagsControl({ value, onChange, allowedValues, controlProps }: ContentValueControlProps) {
  const baseId = useId()
  const selected = Array.isArray(value) ? value.filter(isString) : []
  return (
    <div className="flex flex-wrap gap-2">
      {(allowedValues ?? []).map((tag, index) => {
        const id = `${baseId}-${String(index)}`
        return (
          <Field key={tag} orientation="horizontal">
            <Checkbox
              id={id}
              checked={selected.includes(tag)}
              onCheckedChange={(checked) => {
                onChange(
                  checked === true ? [...selected, tag] : selected.filter((entry) => entry !== tag),
                )
              }}
              {...(controlProps !== undefined && { 'aria-invalid': controlProps['aria-invalid'] })}
            />
            <FieldLabel htmlFor={id}>{tag}</FieldLabel>
          </Field>
        )
      })}
    </div>
  )
}

function EntriesOf({ field, value, onChange, ...rest }: ContentValueControlProps) {
  return (
    <EntriesControl
      field={field}
      entries={Array.isArray(value) ? value : []}
      onChange={onChange}
      {...rest}
    />
  )
}

// The tags the user writes by hand are entries, like the entries of a list.
function TagsControlBySource(props: ContentValueControlProps) {
  const Control = props.field.allowedValuesFrom !== null ? TagsControl : EntriesOf
  return <Control {...props} />
}

// The control of a separator, by the type of its field: a choice as a select, a number as a
// number input, any other value as text.
function SeparatorControl(props: ContentValueControlProps) {
  const Control = isChoiceField(props.field)
    ? SelectControl
    : isNumberField(props.field)
      ? NumberControl
      : TextControl
  return <Control {...props} />
}

// The control of a value by its widget, without a label: a new widget fails to compile until it
// has a row here, as `widgetValueViews` of `ContentFieldValue` does for the view of a value.
const widgetControls = {
  text: TextControl,
  textarea: TextareaControl,
  select: SelectControl,
  number: NumberControl,
  boolean: BooleanControl,
  list: EntriesOf,
  tags: TagsControlBySource,
  'object-list': EntriesOf,
  separator: SeparatorControl,
  'avatar-list': EntriesOf,
  badge: SelectControl,
  'rating-list': EntriesOf,
} as const satisfies Record<
  ContentField['widget'],
  (props: ContentValueControlProps) => React.ReactNode
>

/** The control of a value by its widget, without a label: the table `widgetControls` has a row per widget. */
export function ContentValueControl(props: ContentValueControlProps) {
  const Control = widgetControls[props.field.widget]
  return <Control {...props} />
}
