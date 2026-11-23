import { iconOf, mediaOf } from '@/modules/workflow/entities/@x/artifact'
import type { ThumbnailLook } from '@/shared/components/thumbnail'

import type { FolderThumbnail } from './folder-thumbnails.types'
import type { KindView, OutlineNode } from './outline.types'
import { isBranch } from './outline-path.utils'

/** The title of the thumbnail of the page of a document, which holds its own text. */
export const overviewTitle = 'Overview'

/**
 * The thumbnails of one place of a document, from its rows in the order of the outline. A section or a
 * group that holds items under it is a folder; one that holds none is only text, which the overview
 * of the document reads, so it has no thumbnail. An item is a thumbnail of text or of a diagram, by what
 * its kind says its content is. The color of a folder comes from its title and the color of an item
 * from its kind.
 */
export function folderThumbnails(
  nodes: readonly OutlineNode[],
  kinds: ReadonlyMap<string, KindView>,
): FolderThumbnail[] {
  return nodes.flatMap((node): FolderThumbnail[] => {
    if (node.type === 'field') return []
    if (node.type === 'item') {
      const schema = kinds.get(node.item.kind)?.schema
      const look: ThumbnailLook =
        schema !== undefined && mediaOf(schema) === 'diagram' ? 'diagram' : 'text'
      return [
        {
          id: node.id,
          look,
          title: node.title,
          icon: schema === undefined ? null : iconOf(schema),
          seed: node.item.kind,
          target: { type: 'item', item: node.item },
        },
      ]
    }
    if (folderThumbnails(node.children, kinds).length === 0) return []
    const kind = node.type === 'section' ? node.item.kind : node.kind
    const schema = kinds.get(kind)?.schema
    return [
      {
        id: node.id,
        look: 'folder',
        title: node.title,
        icon: schema === undefined ? null : iconOf(schema),
        seed: node.title,
        target: { type: 'folder', nodeId: node.id },
      },
    ]
  })
}

/** Whether a place of a document has text of its own, besides its folders and items: a section that holds only text. */
function hasText(nodes: readonly OutlineNode[], kinds: ReadonlyMap<string, KindView>): boolean {
  return nodes.some(
    (node) => node.type === 'section' && folderThumbnails(node.children, kinds).length === 0,
  )
}

/**
 * The thumbnails of the top of a document: its overview first, when it has text of its own (filled
 * fields, or a section that holds only text), then its folders and items.
 */
export function rootThumbnails(
  nodes: readonly OutlineNode[],
  kinds: ReadonlyMap<string, KindView>,
  { hasFields }: { hasFields: boolean },
): FolderThumbnail[] {
  const thumbnails = folderThumbnails(nodes, kinds)
  if (!hasFields && !hasText(nodes, kinds) && thumbnails.length > 0) return thumbnails
  return [
    {
      id: 'overview',
      look: 'text',
      title: overviewTitle,
      icon: null,
      seed: 'overview',
      target: { type: 'overview' },
    },
    ...thumbnails,
  ]
}

/** Whether the row of the outline is a folder: it holds a thumbnail under it. */
export function isFolder(node: OutlineNode, kinds: ReadonlyMap<string, KindView>): boolean {
  return isBranch(node) && folderThumbnails(node.children, kinds).length > 0
}
