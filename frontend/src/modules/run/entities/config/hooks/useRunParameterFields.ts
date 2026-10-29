import { useMemo } from 'react'

import {
  type RunParameterField,
  runParameterFields,
  useWorkflowDefinition,
} from '@/modules/workflow/entities/@x/run'

/** The fields of the run parameters of the current workflow; empty while it loads. */
export function useRunParameterFields(): RunParameterField[] {
  const { data } = useWorkflowDefinition()
  return useMemo(
    () => (data === undefined ? [] : runParameterFields(data.run_parameters_schema)),
    [data],
  )
}
