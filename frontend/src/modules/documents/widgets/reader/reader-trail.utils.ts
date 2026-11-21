import {
  itemNodeId,
  type OutlineNode,
  outlinePath,
  overviewTitle,
} from '@/modules/artifact/entities'

import type { ReaderView, TrailPlace, TrailStep } from './reader.types'

/** The path to the folder of the documents of one kind: the list, then the folder itself, which opens nothing. */
export function groupTrail({
  documentsTitle,
  title,
}: {
  documentsTitle: string
  title: string
}): TrailStep[] {
  return [
    { title: documentsTitle, view: { kind: 'documents' } },
    { title, view: null },
  ]
}

/**
 * The path from the list of the documents down to where the reader is: the list, the folder of the
 * documents of its kind when the document is one of several of that kind, the document, the
 * folders above, and the place itself, which is the last step and opens nothing. A folder or an
 * item that the outline does not have ends the path at its document.
 */
export function readerTrail({
  documentsTitle,
  group = null,
  artifact,
  nodes,
  place,
}: {
  documentsTitle: string
  /** The kind of the document and its title, when the document belongs to the folder of its kind. */
  group?: { kind: string; title: string } | null
  artifact: { id: string; title: string }
  nodes: readonly OutlineNode[]
  place: TrailPlace
}): TrailStep[] {
  const documents: TrailStep = { title: documentsTitle, view: { kind: 'documents' } }
  const kindFolder: TrailStep[] =
    group === null
      ? []
      : [{ title: group.title, view: { kind: 'group', documentKind: group.kind } }]
  const document = (isLast: boolean): TrailStep => ({
    title: artifact.title,
    view: isLast ? null : { kind: 'document', artifactId: artifact.id },
  })
  if (place.type === 'document') return [documents, ...kindFolder, document(true)]
  if (place.type === 'overview') {
    return [documents, ...kindFolder, document(false), { title: place.title, view: null }]
  }

  const path = outlinePath(nodes, place.nodeId)
  const folders = place.type === 'item' ? path.slice(0, -1) : path
  const steps: TrailStep[] = folders.map((node, index) => ({
    title: node.title,
    view:
      place.type === 'folder' && index === folders.length - 1
        ? null
        : { kind: 'folder', artifactId: artifact.id, nodeId: node.id },
  }))
  return [
    documents,
    ...kindFolder,
    document(false),
    ...steps,
    ...(place.type === 'item' && place.title !== '' ? [{ title: place.title, view: null }] : []),
  ]
}

/** Where the reader is in a document for a view of the document, a folder of it or an item of it. */
export function trailPlaceOf(
  view: Exclude<ReaderView, { kind: 'documents' | 'group' }>,
  nodes: readonly OutlineNode[],
): TrailPlace {
  switch (view.kind) {
    case 'document':
      return { type: 'document' }
    case 'overview':
      return { type: 'overview', title: overviewTitle }
    case 'folder':
      return { type: 'folder', nodeId: view.nodeId }
    case 'item': {
      const nodeId = itemNodeId(view.itemId)
      return { type: 'item', nodeId, title: outlinePath(nodes, nodeId).at(-1)?.title ?? '' }
    }
  }
}
