'use client'

import { type FieldPath, useFormContext } from 'react-hook-form'

import { FormField, FormFieldSet } from '@/shared/components/form'

import type { WorkflowDefinition } from '../../../definition/workflow-definition.types'
import type { ContentField } from '../../fields/content-fields.types'
import type { ContentFormValues } from '../../values/content-form.schema'
import { ContentFieldValue } from '../ContentFieldValue'
import { ContentValueControl } from './ContentValueControl'

interface ContentFieldInputProps {
  field: ContentField
  /** The values that a field with `x-value-from` may take, read by the form from the artifacts of the project. */
  allowedValues?: readonly string[] | undefined
  /** Titles the values of a field that names a value list; none until the definition loads. */
  definition: Pick<WorkflowDefinition, 'value_lists'> | undefined
}

/**
 * One content field of the form around it (`FormProvider` of `ContentFormValues`), by its widget:
 * its label, its description, its control and its error. A read only field shows its value without
 * a control. The tags that take their values from a field of another artifact are a group of
 * checkboxes, named by a legend.
 */
export function ContentFieldInput({ field, allowedValues, definition }: ContentFieldInputProps) {
  const { control } = useFormContext<ContentFormValues>()
  const name = `content.${field.name}` as FieldPath<ContentFormValues>
  const description = field.description ?? undefined

  if (field.readOnly) {
    return (
      <FormField control={control} name={name} label={field.title} description={description}>
        {(controller) => (
          <ContentFieldValue field={field} value={controller.value} definition={definition} />
        )}
      </FormField>
    )
  }
  if (field.widget === 'tags' && field.allowedValuesFrom !== null) {
    return (
      <FormFieldSet control={control} name={name} legend={field.title} description={description}>
        {(controller) => (
          <ContentValueControl
            field={field}
            value={controller.value}
            onChange={controller.onChange}
            allowedValues={allowedValues}
            definition={definition}
          />
        )}
      </FormFieldSet>
    )
  }
  return (
    <FormField control={control} name={name} label={field.title} description={description}>
      {(controller, controlProps) => (
        <ContentValueControl
          field={field}
          value={controller.value}
          onChange={controller.onChange}
          allowedValues={allowedValues}
          definition={definition}
          controlProps={controlProps}
          formField={{ name: controller.name, onBlur: controller.onBlur }}
          controlRef={controller.ref}
        />
      )}
    </FormField>
  )
}
