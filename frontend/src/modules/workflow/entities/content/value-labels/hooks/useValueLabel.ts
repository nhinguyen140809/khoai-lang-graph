import type { WorkflowDefinition } from '../../../definition/workflow-definition.types'
import type { ContentField } from '../../fields/content-fields.types'
import { useValueLabelOf } from './useValueLabelOf'

/**
 * What a select field shows for its chosen value, in the view of the app: the title that a value
 * list of the definition gives, else the label written for the field, else the value itself.
 */
export function useValueLabel(
  field: Pick<ContentField, 'path' | 'valueList'>,
  value: string,
  definition: Pick<WorkflowDefinition, 'value_lists'> | undefined,
): string {
  return useValueLabelOf(field, definition)(value)
}
