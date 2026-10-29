import {
  type ReviewableCheckpoint,
  type RunParameterField,
  useReviewableCheckpoints,
} from '@/modules/workflow/entities/@x/run'

import { useRunParameterFields } from './useRunParameterFields'

/** What the run settings offer: the reviews a run may pause at, and the parameters of the workflow. */
export function useRunSettingsOptions(): {
  checkpoints: ReviewableCheckpoint[]
  parameterFields: RunParameterField[]
} {
  const { data } = useReviewableCheckpoints()
  return { checkpoints: data ?? [], parameterFields: useRunParameterFields() }
}
