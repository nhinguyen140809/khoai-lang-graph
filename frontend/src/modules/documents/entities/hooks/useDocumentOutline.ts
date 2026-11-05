'use client'

import type { ArtifactOutlineResult } from '@/modules/artifact/entities/@x/documents'
import { useArtifactOutline } from '@/modules/artifact/entities/@x/documents'
import { useOutOfDateItemIds } from '@/modules/trace/entities/@x/documents'

/**
 * The outline of a document with the items made from an older version of an item they link to
 * marked `outOfDate`: the trace of the artifacts supplies the ids.
 */
export function useDocumentOutline(artifactId: string): ArtifactOutlineResult {
  const outOfDateIds = useOutOfDateItemIds(artifactId)
  return useArtifactOutline(artifactId, { outOfDateIds })
}
