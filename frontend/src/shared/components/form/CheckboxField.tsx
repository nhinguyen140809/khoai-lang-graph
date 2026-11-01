'use client'

import type { ReactNode } from 'react'
import { useId } from 'react'
import { type Control, Controller, type FieldPath, type FieldValues } from 'react-hook-form'

import { Checkbox } from '@/shared/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field'

interface CheckboxFieldProps<T extends FieldValues, N extends FieldPath<T>, TContext, TOutput> {
  control: Control<T, TContext, TOutput>
  name: N
  label: ReactNode
  disabled?: boolean
}

/** A field of a form that is true or false: a checkbox with its label beside it, and its error. */
export function CheckboxField<
  T extends FieldValues,
  N extends FieldPath<T>,
  TContext = unknown,
  TOutput = T,
>({ control, name, label, disabled = false }: CheckboxFieldProps<T, N, TContext, TOutput>) {
  const id = useId()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field orientation="horizontal" data-invalid={fieldState.invalid}>
          <Checkbox
            id={id}
            ref={field.ref}
            checked={field.value === true}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            onBlur={field.onBlur}
            onCheckedChange={(checked) => {
              field.onChange(checked === true)
            }}
          />
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
