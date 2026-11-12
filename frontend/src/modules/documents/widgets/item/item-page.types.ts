import type { ArtifactItem } from '@/modules/artifact/entities'
import type { useItemLinks } from '@/modules/trace/entities'

import type { useItemPage } from './hooks/useItemPage'

/** The ways to move from an item to a neighbor in its document. */
export type ItemMove = 'previous' | 'next'

/** What the parts of the page of an item read: the item, its page, its links and its mode. */
export interface ItemPageContextValue {
  projectId: string
  record: ArtifactItem
  page: ReturnType<typeof useItemPage>
  links: ReturnType<typeof useItemLinks>
  isEditing: boolean
  /** The link whose chip or mark is open, so that the two ends of a link light up together. */
  activeLinkId: string | null
  setActiveLinkId: (linkId: string | null) => void
  /** Keeps the tab of the item, once the user has begun to edit it. */
  keepTab: () => void
}
