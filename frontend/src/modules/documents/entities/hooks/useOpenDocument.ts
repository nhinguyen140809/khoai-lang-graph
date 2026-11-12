'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'

import { useItem } from '@/modules/artifact/entities/@x/documents'

/**
 * The artifact and the item of the page on screen, from its address: `artifactId` on a document
 * page; `itemId` on an item page, whose artifact comes from the item. Each is undefined when the
 * page is not of that kind. While an item that is not loaded yet comes in, the artifact stays the
 * one of the item before it, so that what shows the document does not drop and come back.
 */
export function useOpenDocument(): { artifactId: string | undefined; itemId: string | undefined } {
  const params = useParams<{ artifactId?: string; itemId?: string }>()
  const itemId = params.itemId
  const item = useItem(itemId ?? '', undefined, { isEnabled: itemId !== undefined })
  const itemArtifactId = item.data?.artifact_id
  const [lastItemArtifactId, setLastItemArtifactId] = useState(itemArtifactId)
  if (itemArtifactId !== undefined && itemArtifactId !== lastItemArtifactId) {
    setLastItemArtifactId(itemArtifactId)
  }
  const isLoadingItem = itemId !== undefined && item.isPending
  return {
    artifactId:
      params.artifactId ?? itemArtifactId ?? (isLoadingItem ? lastItemArtifactId : undefined),
    itemId,
  }
}
