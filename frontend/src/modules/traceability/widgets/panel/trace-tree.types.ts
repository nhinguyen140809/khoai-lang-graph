import type { Route } from 'next'

import type { Artifact, OutlineNode } from '@/modules/artifact/entities'
import type { DocumentListResult } from '@/modules/documents/entities'
import type { TraceAttentionResult } from '@/modules/trace/entities'
import type { Tone } from '@/shared/lib/tone'

/** One row of the tree of Trace: a document, a section, or an item that opens its chain. */
export interface TraceRow {
  id: string
  /** The title of the row. */
  name: string
  /** What a click opens: the chain of an item; null keeps the row a plain folder or label. */
  href: Route | null
  /** The tone of the title, by how much the row asks of the user; null keeps the plain color. */
  tone: Tone | null
  /** The reasons of the tone, for its tooltip; also read by assistive technology. */
  reasons: readonly string[] | null
  children: string[]
}

/** The id of the root of the tree, which holds every document. */
export const traceTreeRootId = 'trace-root'

/** One document to draw: its artifact, and the kinds of item its kind holds, in the order of the definition. */
export interface DocumentOutlineInput {
  artifact: Artifact
  itemKinds: readonly string[]
}

/** What `traceRows` gives: the rows by id, and the row of each item, so the tree finds the row of the item on screen. */
export interface TraceRows {
  rows: Record<string, TraceRow>
  /** The row of each item, by item id; a document that holds no item has no row for it. */
  rowOfItem: ReadonlyMap<string, string>
}

/** What the rows of the tree of Trace read: the documents, the outline of every one of them, the attention, and the address of a chain. */
export interface TraceRowsInput {
  entries: readonly Extract<DocumentListResult, { state: 'success' }>['entries'][number][]
  /** The outline of every document of the project, by artifact id, whatever the page on screen. */
  outlines: ReadonlyMap<string, readonly OutlineNode[]>
  attention: TraceAttentionResult
  itemTrace: (itemId: string) => Route
}
