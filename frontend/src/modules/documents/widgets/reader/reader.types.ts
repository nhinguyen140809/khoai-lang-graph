import type { Route } from 'next'
import type { ReactNode } from 'react'

import type { ChatReference } from '@/modules/activity/entities'

/** What the reader beside the chat shows: the list of the documents of the project, or a reference of the chat. */
export type ReaderView = { kind: 'documents' } | ChatReference

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
