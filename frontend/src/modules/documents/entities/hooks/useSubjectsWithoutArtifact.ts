'use client'

import { useMemo } from 'react'

import {
  type ArtifactItem,
  useProjectArtifacts,
  useProjectItemsOfKinds,
} from '@/modules/artifact/entities/@x/documents'

/**
 * The subject items of a project that have no artifact yet, for each kind of subject given, in the
 * order of their keys. Read only while `isEnabled` holds.
 */
export function useSubjectsWithoutArtifact(
  projectId: string,
  subjectItemKinds: readonly string[],
  { isEnabled }: { isEnabled: boolean },
): ReadonlyMap<string, ArtifactItem[]> {
  const itemsOfKinds = useProjectItemsOfKinds(projectId, subjectItemKinds, { isEnabled })
  const artifacts = useProjectArtifacts(projectId)
  return useMemo(() => {
    const covered = new Set(artifacts.data?.map(({ subject_item_id }) => subject_item_id))
    return new Map(
      subjectItemKinds.map((kind, index) => [
        kind,
        (itemsOfKinds[index] ?? []).filter(({ id }) => !covered.has(id)),
      ]),
    )
  }, [subjectItemKinds, itemsOfKinds, artifacts.data])
}
