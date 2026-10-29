import { useDefinitionQuery } from '../../definition/hooks/useDefinitionQuery'
import { issueKinds } from '../issues.utils'

/**
 * The kinds of item that record a problem to settle, in a version of the workflow, for the lists
 * of open issues. Without a version it reads the current one.
 */
export function useIssueKinds(version?: number) {
  return useDefinitionQuery(version, issueKinds)
}
