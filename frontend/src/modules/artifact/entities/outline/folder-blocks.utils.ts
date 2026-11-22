import { iconOf, mediaOf } from '@/modules/workflow/entities/@x/artifact'

import type { BlockLook, FolderBlock } from './folder-blocks.types'
import type { KindView, OutlineNode } from './outline.types'
import { isBranch } from './outline.utils'

/** The title of the block of the page of a document, which holds its own text. */
export const overviewTitle = 'Overview'

/**
 * The blocks of one place of a document, from its rows in the order of the outline. A section or a
 * group that holds items under it is a folder; one that holds none is only text, which the overview
 * of the document reads, so it has no block. An item is a block of text or of a diagram, by what
 * its kind says its content is. The color of a folder comes from its title and the color of an item
 * from its kind.
 */
export function folderBlocks(
  nodes: readonly OutlineNode[],
  kinds: ReadonlyMap<string, KindView>,
): FolderBlock[] {
  return nodes.flatMap((node): FolderBlock[] => {
    if (node.type === 'field') return []
    if (node.type === 'item') {
      const schema = kinds.get(node.item.kind)?.schema
      const look: BlockLook =
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
    if (folderBlocks(node.children, kinds).length === 0) return []
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
    (node) => node.type === 'section' && folderBlocks(node.children, kinds).length === 0,
  )
}

/**
 * The blocks of the top of a document: its overview first, when it has text of its own (filled
 * fields, or a section that holds only text), then its folders and items.
 */
export function rootBlocks(
  nodes: readonly OutlineNode[],
  kinds: ReadonlyMap<string, KindView>,
  { hasFields }: { hasFields: boolean },
): FolderBlock[] {
  const blocks = folderBlocks(nodes, kinds)
  if (!hasFields && !hasText(nodes, kinds) && blocks.length > 0) return blocks
  return [
    {
      id: 'overview',
      look: 'text',
      title: overviewTitle,
      icon: null,
      seed: 'overview',
      target: { type: 'overview' },
    },
    ...blocks,
  ]
}

/** Whether the row of the outline is a folder: it holds a block under it. */
export function isFolder(node: OutlineNode, kinds: ReadonlyMap<string, KindView>): boolean {
  return isBranch(node) && folderBlocks(node.children, kinds).length > 0
}
