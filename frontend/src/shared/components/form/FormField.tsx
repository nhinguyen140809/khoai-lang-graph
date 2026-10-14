'use client'

import { type ReactNode, useId } from 'react'
import {
  type Control,
  Controller,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'

import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/components/ui/field'

/** The props that tie a control to the label and the error of its field. */
export interface FieldControlProps {
  id: string
  'aria-invalid': boolean
}

export interface FormFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: ReactNode
  description?: ReactNode
  /** The control of the field, such as a textarea or a select. */
  children: (field: ControllerRenderProps<T, FieldPath<T>>, control: FieldControlProps) => ReactNode
}

/**
 * One field of a form of react-hook-form: its label, its control, its description and its error.
 * The control gets the id of the label and `aria-invalid`, and the field `data-invalid`, from the
 * state of the field, so that no form repeats them.
 */
export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  children,
}: FormFieldProps<T>) {
  const id = useId()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          {children(field, { id, 'aria-invalid': fieldState.invalid })}
          {description !== undefined && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
