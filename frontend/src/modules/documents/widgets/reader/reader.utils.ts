import type { ThumbnailTarget } from '@/modules/artifact/entities'
import type { DocumentEntry } from '@/modules/documents/entities'
import { pathWithQuery } from '@/shared/lib/url'
import { RouteParam } from '@/shared/routes'

import type { ReaderView } from './reader.types'

/** The value of `RouteParam.Reader` that opens the reader on the list of the documents. */
const DOCUMENTS = 'documents'

/** The value of `RouteParam.Folder` that opens the page of the document itself. */
const OVERVIEW = 'overview'

/**
 * What the query of the page names for the reader: a folder or the overview of a document, a
 * document, else an item, else the folder of the documents of one kind, else the list of the
 * documents; null for nothing.
 */
export function readerViewOf({
  documentId,
  folderId,
  groupKind,
  itemId,
  reader,
}: {
  documentId: string | null
  folderId: string | null
  groupKind: string | null
  itemId: string | null
  reader: string | null
}): ReaderView | null {
  if (documentId !== null && folderId === OVERVIEW) {
    return { kind: 'overview', artifactId: documentId }
  }
  if (documentId !== null && folderId !== null) {
    return { kind: 'folder', artifactId: documentId, nodeId: folderId }
  }
  if (documentId !== null) return { kind: 'document', artifactId: documentId }
  if (itemId !== null) return { kind: 'item', itemId }
  if (groupKind !== null) return { kind: 'group', documentKind: groupKind }
  if (reader === DOCUMENTS) return { kind: 'documents' }
  return null
}

/** A key that tells views apart, so that the reader starts afresh on another one. */
export function viewKey(view: ReaderView): string {
  switch (view.kind) {
    case 'documents':
      return 'documents'
    case 'group':
      return `group:${view.documentKind}`
    case 'document':
      return `document:${view.artifactId}`
    case 'overview':
      return `overview:${view.artifactId}`
    case 'folder':
      return `folder:${view.artifactId}:${view.nodeId}`
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
    case 'group':
      return pathWithQuery(path, { [RouteParam.Group]: view.documentKind })
    case 'document':
      return pathWithQuery(path, { [RouteParam.Document]: view.artifactId })
    case 'overview':
      return pathWithQuery(path, {
        [RouteParam.Document]: view.artifactId,
        [RouteParam.Folder]: OVERVIEW,
      })
    case 'folder':
      return pathWithQuery(path, {
        [RouteParam.Document]: view.artifactId,
        [RouteParam.Folder]: view.nodeId,
      })
    case 'item':
      return pathWithQuery(path, { [RouteParam.Item]: view.itemId })
  }
}

/** The view that the thumbnail of a folder opens, in the document with this id. */
export function viewOfThumbnail(target: ThumbnailTarget, artifactId: string): ReaderView {
  switch (target.type) {
    case 'overview':
      return { kind: 'overview', artifactId }
    case 'folder':
      return { kind: 'folder', artifactId, nodeId: target.nodeId }
    case 'item':
      return { kind: 'item', itemId: target.item.id }
  }
}

/** What the thumbnail of an entry of the list opens: a document opens itself, and a group opens the folder of its kind; nothing for a document that is not started. */
export function viewOfEntry(entry: DocumentEntry): ReaderView | null {
  if (entry.type === 'group') return { kind: 'group', documentKind: entry.kind }
  return entry.artifact === null ? null : { kind: 'document', artifactId: entry.artifact.id }
}
