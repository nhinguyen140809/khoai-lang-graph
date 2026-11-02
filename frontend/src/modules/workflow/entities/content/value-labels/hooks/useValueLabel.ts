import { useWording } from '@/shared/lib/view'

import type { WorkflowDefinition } from '../../../definition/workflow-definition.types'
import type { ContentField } from '../../fields/content-fields.types'
import { valueTitle } from '../../values/content-values.utils'
import { valueLabel } from '../value-labels.utils'

/**
 * What a select field shows for its chosen value, in the view of the app: the title that a value
 * list of the definition gives, else the label written for the field, else the value itself.
 */
export function useValueLabel(
  field: Pick<ContentField, 'path' | 'valueList'>,
  value: string,
  definition: Pick<WorkflowDefinition, 'value_lists'> | undefined,
): string {
  const label = useWording(valueLabel(field.path, value))
  return field.valueList === null ? label : valueTitle(field, value, definition)
}
