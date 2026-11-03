'use client'

import { type ReactNode, useId } from 'react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'

import type { RunParameterField, RunParameterWidget } from '@/modules/workflow/entities/@x/run'
import { FormField, FormFieldSet, NumberField, TextField } from '@/shared/components/form'
import { Field, FieldLabel } from '@/shared/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

import { defaultSelectKey, runDefaultsMessages } from '../config/run-defaults.constants'
import {
  defaultChoiceLabelOf,
  defaultTextOf,
  selectKeyOf,
  selectValueOf,
} from '../config/run-defaults.utils'

interface ParameterControlProps<T extends FieldValues, TOutput> {
  control: Control<T, unknown, TOutput>
  name: FieldPath<T>
  field: RunParameterField
}

type ParameterControl = <T extends FieldValues, TOutput>(
  props: ParameterControlProps<T, TOutput>,
) => ReactNode

function NumberParameter<T extends FieldValues, TOutput>({
  control,
  name,
  field,
}: ParameterControlProps<T, TOutput>) {
  return (
    <NumberField
      control={control}
      name={name}
      label={field.title}
      description={field.description ?? undefined}
      integer={field.integer}
      placeholder={defaultTextOf(field) ?? undefined}
      {...(field.minimum !== null && { min: field.minimum })}
      {...(field.maximum !== null && { max: field.maximum })}
    />
  )
}

// A flag in the run settings has three states, so no checkbox can show it: one group of
// radio buttons offers "use the default" (null, and the next level supplies it), on and off. What
// the group shows is what is sent: true, false, or nothing.
const flagChoices = [
  { key: 'default', label: defaultChoiceLabelOf, value: null },
  { key: 'on', label: () => runDefaultsMessages.flagOn, value: true },
  { key: 'off', label: () => runDefaultsMessages.flagOff, value: false },
] as const

function FlagParameter<T extends FieldValues, TOutput>({
  control,
  name,
  field,
}: ParameterControlProps<T, TOutput>) {
  const baseId = useId()
  return (
    <FormFieldSet
      control={control}
      name={name}
      legend={field.title}
      description={field.description ?? undefined}
    >
      {(controller) => {
        const current = flagChoices.find(({ value }) => value === (controller.value ?? null))
        return (
          <RadioGroup
            aria-label={field.title}
            value={(current ?? flagChoices[0]).key}
            onValueChange={(key) => {
              controller.onChange(flagChoices.find((choice) => choice.key === key)?.value ?? null)
            }}
          >
            {flagChoices.map((choice) => (
              <Field key={choice.key} orientation="horizontal">
                <RadioGroupItem id={`${baseId}-${choice.key}`} value={choice.key} />
                <FieldLabel htmlFor={`${baseId}-${choice.key}`}>{choice.label(field)}</FieldLabel>
              </Field>
            ))}
          </RadioGroup>
        )
      }}
    </FormFieldSet>
  )
}

function SelectParameter<T extends FieldValues, TOutput>({
  control,
  name,
  field,
}: ParameterControlProps<T, TOutput>) {
  return (
    <FormField
      control={control}
      name={name}
      label={field.title}
      description={field.description ?? undefined}
    >
      {(controller, controlProps) => (
        <Select
          value={selectKeyOf(field, controller.value)}
          onValueChange={(key) => {
            controller.onChange(selectValueOf(field, key))
          }}
        >
          <SelectTrigger {...controlProps} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={defaultSelectKey}>{defaultChoiceLabelOf(field)}</SelectItem>
            {field.options.map((option, index) => (
              <SelectItem key={option} value={String(index)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  )
}

function TextParameter<T extends FieldValues, TOutput>({
  control,
  name,
  field,
}: ParameterControlProps<T, TOutput>) {
  return (
    <TextField
      control={control}
      name={name}
      label={field.title}
      description={field.description ?? undefined}
      placeholder={defaultTextOf(field) ?? undefined}
    />
  )
}

// The control of each widget of a run parameter. A new widget gets its row here, and TypeScript
// reports one that has none.
const parameterControls = {
  text: TextParameter,
  select: SelectParameter,
  number: NumberParameter,
  boolean: FlagParameter,
} as const satisfies Record<RunParameterWidget, ParameterControl>

/** The control for one run parameter: the one of its widget. */
export function ParameterField<T extends FieldValues, TOutput>(
  props: ParameterControlProps<T, TOutput>,
) {
  const Control: ParameterControl = parameterControls[props.field.widget]
  return <Control {...props} />
}
