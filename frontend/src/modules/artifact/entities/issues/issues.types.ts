import type { ArtifactItem } from '../items/items.types'

/** An item with the fields that a list of issues reads: an issue, or an item that it is about. */
export type IssueItem = Pick<ArtifactItem, 'id' | 'key' | 'kind' | 'content'>

/** The two ends of a link between items; the issue is the source and its subject the target. */
export interface IssueLink {
  source_item_id: string
  target_item_id: string
}

/** An open issue and the items it is about, its subjects. */
interface IssueWithSubjects<T extends IssueItem> {
  issue: T
  subjects: T[]
}

/** The open issues of one issue kind. */
export interface IssueGroup<T extends IssueItem> {
  kind: string
  entries: IssueWithSubjects<T>[]
}
