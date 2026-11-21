import type { ThumbnailLook } from '@/shared/components/thumbnail'

import type { OutlineItem } from '../items/items.types'

/** What a thumbnail opens: the page of the document itself, a folder of a section or of a group, or the page of an item. */
export type ThumbnailTarget =
  { type: 'overview' } | { type: 'folder'; nodeId: string } | { type: 'item'; item: OutlineItem }

/** One thumbnail of the grid of a folder: a document, a section or a group of items, or an item. */
export interface FolderThumbnail {
  id: string
  look: ThumbnailLook
  title: string
  /** The name of the icon on the thumbnail; null for a thumbnail without one. */
  icon: string | null
  /** The text that the color of the thumbnail comes from: the title of a folder, the kind of an item. */
  seed: string
  target: ThumbnailTarget
}
