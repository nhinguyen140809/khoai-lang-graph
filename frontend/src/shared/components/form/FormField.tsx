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

/**
 * The props of a field of a form: the `control` of the form, which also carries the values that
 * its schema gives on submit, and the `name` of the field, whose value the control receives.
 */
export interface FormFieldProps<
  T extends FieldValues,
  N extends FieldPath<T>,
  TContext = unknown,
  TOutput = T,
> {
  control: Control<T, TContext, TOutput>
  name: N
  label: ReactNode
  description?: ReactNode
  /**
   * An action of the field, such as the link that resets a password, at the end of the line under
   * the control. The error of the field takes the start of that line, so it never moves the action.
   */
  action?: ReactNode
  /** The control of the field, such as a textarea or a select. */
  children: (field: ControllerRenderProps<T, N>, control: FieldControlProps) => ReactNode
}

/**
 * One field of a form of react-hook-form: its label, its control, its description, its error and
 * its action.
 * The control gets the id of the label and `aria-invalid`, and the field `data-invalid`, from the
 * state of the field, so that no form repeats them.
 */
export function FormField<
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
  children,
}: FormFieldProps<T, N, TContext, TOutput>) {
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
          {action === undefined ? (
            <FieldError errors={[fieldState.error]} />
          ) : (
            <div className="flex items-baseline gap-4">
              <FieldError errors={[fieldState.error]} className="min-w-0 flex-1" />
              <div className="ml-auto shrink-0">{action}</div>
            </div>
          )}
        </Field>
      )}
    />
  )
}
