'use client'

import { useParams } from 'next/navigation'

import { useItem } from '@/modules/artifact/entities'

/**
 * The artifact and the item of the page on screen, from its address: `artifactId` on a document
 * page; `itemId` on an item page, whose artifact comes from the item. Each is undefined when the
 * page is not of that kind.
 */
export function useOpenDocument(): { artifactId: string | undefined; itemId: string | undefined } {
  const params = useParams<{ artifactId?: string; itemId?: string }>()
  const itemId = params.itemId
  const item = useItem(itemId ?? '', undefined, { isEnabled: itemId !== undefined })
  return { artifactId: params.artifactId ?? item.data?.artifact_id, itemId }
}
