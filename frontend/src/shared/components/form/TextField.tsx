'use client'

import type { ComponentProps } from 'react'
import type { FieldPath, FieldValues } from 'react-hook-form'

import { Input } from '@/shared/components/ui/input'

import { FormField, type FormFieldProps } from './FormField'

type TextFieldProps<T extends FieldValues, N extends FieldPath<T>, TContext, TOutput> = Omit<
  FormFieldProps<T, N, TContext, TOutput>,
  'children'
> &
  Omit<ComponentProps<typeof Input>, 'id' | 'name' | 'value' | 'onChange' | 'onBlur' | 'children'>

/** A text field of a form: an input with its label, its description and its error. */
export function TextField<
  T extends FieldValues,
  N extends FieldPath<T>,
  TContext = unknown,
  TOutput = T,
>({ control, name, label, description, ...inputProps }: TextFieldProps<T, N, TContext, TOutput>) {
  return (
    <FormField control={control} name={name} label={label} description={description}>
      {(field, controlProps) => (
        <Input
          {...inputProps}
          {...field}
          value={typeof field.value === 'string' ? field.value : ''}
          {...controlProps}
        />
      )}
    </FormField>
  )
}
