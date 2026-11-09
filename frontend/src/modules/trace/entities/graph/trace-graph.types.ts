import type { AttentionLevel, ReviewStatus } from '@/modules/artifact/entities/@x/trace'
import type { ContentValues, IssueKind } from '@/modules/workflow/entities/@x/trace'

import type { TraceItem } from '../chains/chains.types'

// The graph of the chain of an item, for drawing: an item is a node and a link is an edge. `items`
// and `links` are the data of the trace; the nodes and the edges are the same data shaped for the
// drawing, with the attention of each.

/** An item as `itemAttention` reads it. */
export type AttentionItem = Pick<TraceItem, 'id' | 'kind' | 'review_status' | 'content'>

/** How much an item asks of the user, with the reasons in words for a tooltip. */
export interface ItemAttention {
  level: AttentionLevel
  reasons: string[]
}

/** What an item sits in, so `itemAttention` can tell how much it asks of the user: the gaps that hold it, and the open issues about it or that it is. */
export interface AttentionContext {
  /** The gaps that hold each item, with their keys and the descriptions the user reads. */
  gapsOfItem: ReadonlyMap<string, readonly { key: string; description: string }[]>
  /** The words that say, for each item, that an open issue is about it. */
  issueReasonsOfItem: ReadonlyMap<string, readonly string[]>
  /** The items that are themselves open issues. */
  openIssueIds: ReadonlySet<string>
}

/** An item of a chain as a node of its graph. */
export interface ChainNodeData {
  id: string
  /** The artifact that holds the item, which says whether its document may change. */
  artifactId: string
  /** The kind of the item, as the definition names it. */
  kind: string
  kindTitle: string
  title: string
  key: string
  /** The content of the item, which says where the words a link quotes of it sit. */
  content: ContentValues
  reviewStatus: ReviewStatus
  attention: ItemAttention
  isFocus: boolean
}

/** A link of a chain as an edge of its graph, from the later item to the item it was built from. */
export interface ChainEdgeData {
  id: string
  source: string
  target: string
  /** The artifact that holds the source item, which says whether the link may change. */
  sourceArtifactId: string
  linkType: string
  linkTitle: string
  attention: AttentionLevel
  sourceQuote: string | null
  targetQuote: string | null
  /** The version of the target that the link was made from, when it is out of date. */
  madeFromVersion: number | null
}

/** The nodes and the edges of the chain of an item. */
export interface ChainGraph {
  nodes: ChainNodeData[]
  edges: ChainEdgeData[]
}

/** What the graph of a chain reads from its project: the item it is the chain of, the kinds that record a problem, the words of its items and links, and the attention of its items. */
export interface ChainContext {
  /** The id of the item whose chain the graph draws. */
  focusId: string
  /** The kinds of item that record a problem, to tell the links that come from an open issue. */
  issueKinds: readonly IssueKind[]
  titleOf: (item: TraceItem) => string
  kindTitleOf: (item: TraceItem) => string
  linkTitleOf: (linkType: string) => string
  attentionOf: (item: AttentionItem) => ItemAttention
}

/** The attention of the items of a project, from its gaps and its open issues; a union with `state`. */
export type TraceAttentionResult =
  | { state: 'pending' }
  | { state: 'error'; error: Error; retry: () => void }
  | {
      state: 'success'
      attentionOf: (item: AttentionItem) => ItemAttention
      /** The attention of each document, the level of the item under it that asks most, with the reasons; the tree of Trace colors its rows with it. */
      attentionByArtifact: ReadonlyMap<string, ItemAttention>
    }

/** The chain of an item as a graph, with the attention of its items and links; a union with `state`. */
export type ItemChainResult =
  | { state: 'pending' }
  | { state: 'error'; error: Error; retry: () => void }
  | { state: 'notFound' }
  | { state: 'success'; graph: ChainGraph; focus: ChainNodeData }
