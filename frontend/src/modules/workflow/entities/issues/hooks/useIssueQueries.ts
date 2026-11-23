import { useDefinitionQuery } from '../../definition/hooks/useDefinitionQuery'
import type { WorkflowRef } from '../../workflow-ref/workflow-ref.types'
import { issueKinds, issueLinkTypesByKind } from '../issues.utils'

/**
 * The kinds of item that record a problem to settle, in a workflow at a version, for the lists
 * of open issues. Without a workflow it reads the current one.
 */
export function useIssueKinds(workflow?: WorkflowRef) {
  return useDefinitionQuery(workflow, issueKinds)
}

/**
 * The link types that tie the issues of each issue kind to the items they are about and to the
 * people they involve, by kind, in a workflow at a version. Without a workflow it reads the
 * current one.
 */
export function useIssueLinkTypes(workflow?: WorkflowRef) {
  return useDefinitionQuery(workflow, issueLinkTypesByKind)
}
