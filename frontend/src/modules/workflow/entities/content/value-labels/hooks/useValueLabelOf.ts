'use client'

import { useView } from '@/shared/lib/view'

import type { WorkflowDefinition } from '../../../definition/workflow-definition.types'
import type { ContentField } from '../../fields/content-fields.types'
import { valueTitle } from '../../values/content-values.utils'
import { valueLabel } from '../value-labels.utils'

/**
 * What a select field shows for each of its values, in the view of the app: the title that a value
 * list of the definition gives, else the label written for the field, else the value itself. The
 * form of a select reads it once and shows it for every option.
 */
export function useValueLabelOf(
  field: Pick<ContentField, 'path' | 'valueList'>,
  definition: Pick<WorkflowDefinition, 'value_lists'> | undefined,
): (value: string) => string {
  const view = useView()
  return (value: string) =>
    field.valueList === null
      ? valueLabel(field.path, value)[view]
      : valueTitle(field, value, definition)
}
