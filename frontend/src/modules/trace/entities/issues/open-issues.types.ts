import type { ArtifactItem } from '@/modules/artifact/entities/@x/trace'
import type { IssueKind, IssueLinkTypes } from '@/modules/workflow/entities/@x/trace'

import type { TraceLink } from '../links/trace-links.types'

// The open issues of a project: each issue that is still open, with the items it is about and the
// people it involves, in words the user reads.

/** One open issue: the issue itself, what the problem is, the items it is about, and the people it involves. */
export interface OpenIssueEntry {
  issue: ArtifactItem
  /** The main text of the issue: what the problem is. */
  problem: string
  subjects: { item: ArtifactItem; link: TraceLink }[]
  /** The people of a conflict, the targets of its `involves` links. */
  sides: ArtifactItem[]
}

/** The open issues of one kind of issue. */
export interface OpenIssueGroup {
  kind: string
  /** The title of the kind of the issues, such as "Disagreement". */
  kindTitle: string
  entries: OpenIssueEntry[]
}

/** What the entries of the open issues read from their project: the kinds that record a problem, the link types of each kind that tie an issue to the items it is about and to the people it involves, and the words of the items. */
export interface IssueContext {
  /** The kinds of item that record a problem, in the order of the definition. */
  issueKinds: readonly IssueKind[]
  /** The link types that tie an issue of a kind to the items it is about and to the people it involves. */
  linkTypesOf: (kind: string) => IssueLinkTypes
  /** The title of the kind of an item, such as "Disagreement". */
  kindTitleOf: (kind: string) => string
  /** The main text of an item: the value of the main field of the schema of its kind. */
  mainTextOf: (item: ArtifactItem) => string
}

/** The open issues of a project, grouped by their kind; a union with `state`. */
export type OpenIssuesResult =
  | { state: 'pending' }
  | { state: 'error'; error: Error; retry: () => void }
  | {
      state: 'success'
      groups: OpenIssueGroup[]
      count: number
      /** The artifact that holds each item of the project, from the same read; the tree of Trace colors a document by what its items ask of the user. */
      artifactByItem: ReadonlyMap<string, string>
      /** Every item of the project, from the same read; the tree of Trace draws every document from them, without a read of its own. */
      items: readonly ArtifactItem[]
    }
