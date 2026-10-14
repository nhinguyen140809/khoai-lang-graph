'use client'

import type { ComponentProps } from 'react'
import type { FieldValues } from 'react-hook-form'

import { Input } from '@/shared/components/ui/input'

import { FormField, type FormFieldProps } from './FormField'

type TextFieldProps<T extends FieldValues> = Omit<FormFieldProps<T>, 'children'> &
  Omit<ComponentProps<typeof Input>, 'id' | 'name' | 'value' | 'onChange' | 'onBlur' | 'children'>

/** A text field of a form: an input with its label, its description and its error. */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  ...inputProps
}: TextFieldProps<T>) {
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
