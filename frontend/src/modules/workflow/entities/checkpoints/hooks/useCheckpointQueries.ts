import { useDefinitionQuery } from '../../definition/hooks/useDefinitionQuery'
import { reviewableCheckpoints } from '../checkpoints.utils'

/**
 * The reviews the user may turn on for a run, one for each checkpoint of the workflow, for the
 * run settings. Without a version it reads the current one, which a new run starts with.
 */
export function useReviewableCheckpoints(version?: number) {
  return useDefinitionQuery(version, reviewableCheckpoints)
}
