import { useMemo } from 'react'

import {
  type RunParameterField,
  runParameterFields,
  useWorkflowDefinition,
} from '@/modules/workflow/entities/@x/run'
import { useView } from '@/shared/lib/view'

import { parameterFieldsOfView } from '../run-defaults.utils'

/** The fields of the run parameters of the current workflow that the view shows; empty while it loads. */
export function useRunParameterFields(): RunParameterField[] {
  const { data } = useWorkflowDefinition()
  const view = useView()
  return useMemo(
    () =>
      data === undefined
        ? []
        : parameterFieldsOfView(runParameterFields(data.run_parameters_schema), view),
    [data, view],
  )
}
