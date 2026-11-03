'use client'

import { useAllowedValuesOf } from '@/modules/artifact/entities'
import {
  type ContentField,
  ContentFieldInput,
  useWorkflowDefinition,
} from '@/modules/workflow/entities'

/**
 * The inputs of the content fields of a form: the values that a field with `x-value-from` may
 * take, read from the artifacts of the project, and the titles of the values of a value list.
 */
export function ContentFieldInputs({
  projectId,
  fields,
}: {
  projectId: string
  fields: readonly ContentField[]
}) {
  const allowedValues = useAllowedValuesOf(projectId, fields)
  const { data: definition } = useWorkflowDefinition()

  return (
    <>
      {fields.map((field) => (
        <ContentFieldInput
          key={field.name}
          field={field}
          allowedValues={allowedValues.get(field.name)}
          definition={definition}
        />
      ))}
    </>
  )
}
