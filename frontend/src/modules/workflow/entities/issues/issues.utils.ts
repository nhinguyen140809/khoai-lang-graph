import type { ContentValues } from '../content/values/content-values.types'
import type { WorkflowDefinition } from '../definition/workflow-definition.types'
import type { IssueKind } from './issues.types'

/** The item kinds that record a problem to settle, in the order of the definition. */
export function issueKinds(definition: WorkflowDefinition): IssueKind[] {
  return definition.item_kinds.flatMap(({ kind, issue }) =>
    issue === null
      ? []
      : [{ kind, statusField: issue.status_field, openValues: issue.open_values }],
  )
}

/** Whether an item is an issue that is still open: its kind records a problem, and its status is one of the open values. */
export function isOpenIssue(
  item: { kind: string; content: ContentValues },
  kinds: readonly IssueKind[],
): boolean {
  const issueKind = kinds.find(({ kind }) => kind === item.kind)
  if (issueKind === undefined) return false
  const status = item.content[issueKind.statusField]
  return issueKind.openValues.some((value) => value === status)
}
