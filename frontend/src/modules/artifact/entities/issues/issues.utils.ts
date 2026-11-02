// `@x` and no merge: the workflow entity owns the versioned definition, which is read on its own,
// and the artifact entity owns the items; each has its own reason to change.
import { isOpenIssue, type IssueKind } from '@/modules/workflow/entities/@x/artifact'
import { successorsFrom } from '@/shared/lib/graph'

import type { IssueGroup, IssueItem, IssueLink } from './issues.types'

/**
 * The open issues of each issue kind, in key order, each with its subjects: the targets of the
 * links that start at the issue. An item that is not in `items` is left out of the subjects.
 */
export function issuesWithSubjects<T extends IssueItem>(
  items: readonly T[],
  links: readonly IssueLink[],
  issueKinds: readonly IssueKind[],
): IssueGroup<T>[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  const subjectIdsOf = successorsFrom(
    links,
    (link) => link.source_item_id,
    (link) => link.target_item_id,
  )
  const open = items.filter((item) => isOpenIssue(item, issueKinds))
  return issueKinds.map(({ kind }) => ({
    kind,
    entries: open
      .filter((item) => item.kind === kind)
      .toSorted((a, b) => a.key.localeCompare(b.key))
      .map((issue) => ({
        issue,
        subjects: subjectIdsOf(issue.id).flatMap((id) => byId.get(id) ?? []),
      })),
  }))
}
