import type { OutlineItem } from '../items/items.types'

/** How a block of a folder is drawn: a folder, a block of text, or a block of a diagram. */
export type BlockLook = 'folder' | 'text' | 'diagram'

/** What a block opens: the page of the document itself, a folder of a section or of a group, or the page of an item. */
export type BlockTarget =
  { type: 'overview' } | { type: 'folder'; nodeId: string } | { type: 'item'; item: OutlineItem }

/** One block of the grid of a folder: a document, a section or a group of items, or an item. */
export interface FolderBlock {
  id: string
  look: BlockLook
  title: string
  /** The name of the icon on the block; null for a block without one. */
  icon: string | null
  /** The text that the color of the block comes from: the title of a folder, the kind of an item. */
  seed: string
  target: BlockTarget
}
