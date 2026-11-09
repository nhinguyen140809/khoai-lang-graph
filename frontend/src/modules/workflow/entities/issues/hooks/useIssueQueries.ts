import { useDefinitionQuery } from '../../definition/hooks/useDefinitionQuery'
import { issueKinds, issueLinkTypesByKind } from '../issues.utils'

/**
 * The kinds of item that record a problem to settle, in a version of the workflow, for the lists
 * of open issues. Without a version it reads the current one.
 */
export function useIssueKinds(version?: number) {
  return useDefinitionQuery(version, issueKinds)
}

/**
 * The link types that tie the issues of each issue kind to the items they are about and to the
 * people they involve, by kind, in a version of the workflow. Without a version it reads the
 * current one.
 */
export function useIssueLinkTypes(version?: number) {
  return useDefinitionQuery(version, issueLinkTypesByKind)
}
