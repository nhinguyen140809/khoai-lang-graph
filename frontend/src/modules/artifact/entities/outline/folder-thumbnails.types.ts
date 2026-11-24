import type { FaceSpec } from '@/shared/components/face'
import type { ThumbnailLook } from '@/shared/components/thumbnail'

import type { OutlineItem } from '../items/items.types'

/** What a thumbnail opens: the page of the document itself, a folder of a section or of a group, or the page of an item. */
export type ThumbnailTarget =
  { type: 'overview' } | { type: 'folder'; nodeId: string } | { type: 'item'; item: OutlineItem }

/** The face of the item a thumbnail shows, drawn in place of the icon of its kind: the spec it carries and the key it comes from. */
export interface FolderAvatar {
  spec: FaceSpec | null
  seed: string
}

/** One thumbnail of the grid of a folder: a document, a section or a group of items, or an item. */
export interface FolderThumbnail {
  id: string
  look: ThumbnailLook
  title: string
  /** The name of the icon on the thumbnail; null for a thumbnail without one. */
  icon: string | null
  /** The face of the item the thumbnail shows, when its kind names an avatar; drawn in place of the icon. */
  avatar: FolderAvatar | null
  /** The text that the color of the thumbnail comes from: the title of a folder, the kind of an item. */
  seed: string
  target: ThumbnailTarget
}
