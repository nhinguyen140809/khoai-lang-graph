'use client'

import type { ComponentProps } from 'react'
import type { FieldPath, FieldValues } from 'react-hook-form'

import { FormField, type FormFieldProps } from '../FormField'
import { NumberInput } from './NumberInput'

type NumberFieldProps<T extends FieldValues, N extends FieldPath<T>, TContext, TOutput> = Omit<
  FormFieldProps<T, N, TContext, TOutput>,
  'children'
> &
  Omit<
    ComponentProps<typeof NumberInput>,
    'id' | 'name' | 'value' | 'onValueChange' | 'onBlur' | 'ref' | 'children'
  >

/**
 * A number field of a form: a number input with its label, its description, its error and its
 * action. The value of the field is a number, and `undefined` while the input is empty, so that a
 * schema of `z.number()` says "required" without a null in the values of the form; leave the field
 * out of `defaultValues` for an empty input, or give it the number to start from. `min`, `max`,
 * `step` and `integer` shape the input; the schema of the form still checks the value on submit.
 */
export function NumberField<
  T extends FieldValues,
  N extends FieldPath<T>,
  TContext = unknown,
  TOutput = T,
>({
  control,
  name,
  label,
  description,
  action,
  disabled,
  ...inputProps
}: NumberFieldProps<T, N, TContext, TOutput>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      action={action}
    >
      {(field, controlProps) => (
        <NumberInput
          {...inputProps}
          {...controlProps}
          name={field.name}
          ref={field.ref}
          disabled={field.disabled ?? disabled}
          value={typeof field.value === 'number' ? field.value : null}
          onValueChange={(value) => {
            field.onChange(value ?? undefined)
          }}
          onBlur={field.onBlur}
        />
      )}
    </FormField>
  )
}
