import type { ArtifactItem } from '@/modules/artifact/entities/@x/trace'
import { isOpenIssue } from '@/modules/workflow/entities/@x/trace'

import type { TraceLink } from '../links/trace-links.types'
import type { IssueContext, OpenIssueEntry, OpenIssueGroup } from './open-issues.types'

/**
 * The open issues of a project, grouped by their kind in the order of the definition and by key
 * order inside a kind, each with its problem text, the items it is about and the people it involves
 * through the link types that the definition names for the kind. An issue or an item that is not among `items` is
 * left out, since its words cannot be shown.
 */
export function openIssueEntries(
  items: readonly ArtifactItem[],
  links: readonly TraceLink[],
  context: IssueContext,
): OpenIssueGroup[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  return context.issueKinds.flatMap(({ kind }) => {
    const { about, parties } = context.linkTypesOf(kind)
    const entries = items
      .filter((item) => item.kind === kind && isOpenIssue(item, context.issueKinds))
      .toSorted((a, b) => a.key.localeCompare(b.key))
      .map((issue): OpenIssueEntry => ({
        issue,
        problem: context.mainTextOf(issue),
        subjects: links.flatMap((link) => {
          if (link.source_item_id !== issue.id || !about.includes(link.link_type)) return []
          const item = byId.get(link.target_item_id)
          return item === undefined ? [] : [{ item, link }]
        }),
        sides: links.flatMap((link) => {
          if (link.source_item_id !== issue.id || !parties.includes(link.link_type)) return []
          const item = byId.get(link.target_item_id)
          return item === undefined ? [] : [item]
        }),
      }))
    return entries.length === 0 ? [] : [{ kind, kindTitle: context.kindTitleOf(kind), entries }]
  })
}
