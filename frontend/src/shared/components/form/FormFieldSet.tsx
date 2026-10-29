'use client'

import type { ReactNode } from 'react'
import {
  type Control,
  Controller,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'

import { FieldDescription, FieldError, FieldLegend, FieldSet } from '@/shared/components/ui/field'

/**
 * The props of a field of a form whose control is a group: the `control` of the form and the
 * `name` of the field, as for `FormField`, and a legend in place of the label.
 */
export interface FormFieldSetProps<
  T extends FieldValues,
  N extends FieldPath<T>,
  TContext = unknown,
  TOutput = T,
> {
  control: Control<T, TContext, TOutput>
  name: N
  /** What the group is. A legend names the group, since no single control is the field. */
  legend: ReactNode
  description?: ReactNode
  /**
   * Something that acts on the whole group, such as a switch: it sits at the end of the line of the
   * legend.
   */
  action?: (field: ControllerRenderProps<T, N>) => ReactNode
  /** The controls of the group, each with a label of its own. */
  children: (field: ControllerRenderProps<T, N>) => ReactNode
}

/**
 * One field of a form of react-hook-form whose control is a group of controls, such as the
 * checkboxes of a list: its legend, its description, its controls and its error. The group gets
 * `data-invalid` from the state of the field.
 */
export function FormFieldSet<
  T extends FieldValues,
  N extends FieldPath<T>,
  TContext = unknown,
  TOutput = T,
>({
  control,
  name,
  legend,
  description,
  action,
  children,
}: FormFieldSetProps<T, N, TContext, TOutput>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldSet data-invalid={fieldState.invalid} className="relative">
          <FieldLegend variant="label">{legend}</FieldLegend>
          {action !== undefined && (
            <div className="absolute top-0 right-0 -mt-1.5 -translate-y-full">{action(field)}</div>
          )}
          {description !== undefined && <FieldDescription>{description}</FieldDescription>}
          {children(field)}
          <FieldError errors={[fieldState.error]} />
        </FieldSet>
      )}
    />
  )
}
