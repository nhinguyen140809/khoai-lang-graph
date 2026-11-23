import type { Route } from 'next'
import type { ReactNode } from 'react'

import type { ChatReference } from '@/modules/activity/entities'

/**
 * What the reader beside the chat shows: the list of the documents of the project, the folder of the
 * documents of one kind, a reference of
 * the chat (a document, which is the grid of its blocks when it holds items, or an item), the page
 * of a document itself (its overview), or one folder of a document.
 */
export type ReaderView =
  | { kind: 'documents' }
  | { kind: 'group'; documentKind: string }
  | ChatReference
  | { kind: 'overview'; artifactId: string }
  | { kind: 'folder'; artifactId: string; nodeId: string }

/** The address of the page with the reader open on a view. */
export type ReaderHref = (view: ReaderView) => Route

/**
 * Draws the title that names the reader to assistive technology, in the element that the place
 * of the reader needs. The content draws its own heading, so the title is no heading of its own.
 */
export type RenderReaderTitle = (title: string) => ReactNode

/** What every body of the reader is given, whichever view it draws; `view` is the one of its own kind. */
export interface ReaderBodyProps<Kind extends ReaderView['kind']> {
  projectId: string
  view: Extract<ReaderView, { kind: Kind }>
  /** The address of the page with the reader open on another view, for the links inside it. */
  hrefOf: ReaderHref
  renderTitle: RenderReaderTitle
}

/** One step of the path that the reader shows above its content: a title and, but for the last step, the view it opens. */
export interface TrailStep {
  title: string
  view: ReaderView | null
}

/** Where the reader is in a document, below the document itself. */
export type TrailPlace =
  | { type: 'document' }
  | { type: 'overview'; title: string }
  | { type: 'folder'; nodeId: string }
  | { type: 'item'; nodeId: string; title: string }
