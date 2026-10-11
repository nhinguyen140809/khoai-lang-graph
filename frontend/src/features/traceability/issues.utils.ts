import { issueKinds, OPEN_STATUS } from './issue-kinds.constants'
import type { Link, ProjectItem } from './traceability.types'

export interface IssueEntry {
  issue: ProjectItem
  /** What the issue is about. */
  about: ProjectItem[]
}

export interface IssueGroup {
  kind: string
  label: string
  entries: IssueEntry[]
}

/** The open issues of each issue kind, with the items that they are about. */
export function openIssues(items: ProjectItem[], links: Link[]): IssueGroup[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  return issueKinds.map(({ kind, label }) => ({
    kind,
    label,
    entries: items
      .filter((item) => item.kind === kind && item.content.status === OPEN_STATUS)
      .toSorted((a, b) => a.key.localeCompare(b.key))
      .map((issue) => ({
        issue,
        about: links
          .filter((link) => link.source_item_id === issue.id)
          .flatMap((link) => byId.get(link.target_item_id) ?? []),
      })),
  }))
}
