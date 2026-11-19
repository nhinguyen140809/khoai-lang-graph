import { pathWithQuery } from '@/shared/lib/url'
import { RouteParam } from '@/shared/routes'

import type { ReaderView } from './reader.types'

/** The value of `RouteParam.Reader` that opens the reader on the list of the documents. */
const DOCUMENTS = 'documents'

/**
 * What the query of the page names for the reader: a document, else an item, else the list of the
 * documents; null for nothing.
 */
export function readerViewOf({
  documentId,
  itemId,
  reader,
}: {
  documentId: string | null
  itemId: string | null
  reader: string | null
}): ReaderView | null {
  if (documentId !== null) return { kind: 'document', artifactId: documentId }
  if (itemId !== null) return { kind: 'item', itemId }
  if (reader === DOCUMENTS) return { kind: 'documents' }
  return null
}

/** A key that tells views apart, so that the reader starts afresh on another one. */
export function viewKey(view: ReaderView): string {
  switch (view.kind) {
    case 'documents':
      return 'documents'
    case 'document':
      return `document:${view.artifactId}`
    case 'item':
      return `item:${view.itemId}`
  }
}

/** Whether two views show the same thing; false when one is missing. */
export function isSameView(first: ReaderView | null, second: ReaderView | null): boolean {
  return first !== null && second !== null && viewKey(first) === viewKey(second)
}

/**
 * The views the reader has shown since it opened, the last one on show: opening a view adds it,
 * and going back to the one before it takes the last off. Closing the reader empties it.
 */
export function trailAfter(trail: readonly ReaderView[], view: ReaderView | null): ReaderView[] {
  if (view === null) return []
  const last = trail.at(-1) ?? null
  if (isSameView(last, view)) return [...trail]
  if (isSameView(trail.at(-2) ?? null, view)) return trail.slice(0, -1)
  return [...trail, view]
}

/** The address of a page with the reader open on a view, in the place of the query before it. */
export function readerAddress(path: string, view: ReaderView): string {
  switch (view.kind) {
    case 'documents':
      return pathWithQuery(path, { [RouteParam.Reader]: DOCUMENTS })
    case 'document':
      return pathWithQuery(path, { [RouteParam.Document]: view.artifactId })
    case 'item':
      return pathWithQuery(path, { [RouteParam.Item]: view.itemId })
  }
}
