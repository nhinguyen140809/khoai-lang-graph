'use client'

import { useMemo } from 'react'

import { useIssueKinds } from '@/modules/workflow/entities/@x/artifact'

import { useArtifact } from '../../artifacts/hooks/useArtifactQueries'
import { useItemSchema } from '../../items/hooks/useItemQueries'
import type { ArtifactOutlineResult } from '../outline.types'
import { artifactOutline, outlineStatuses } from '../outline.utils'
import { useOutlineItems } from './useOutlineItems'

/**
 * The outline of an artifact, in the order of its document, and the status of each of its items.
 * The items made from an older version of an item they link to come in as `outOfDateIds`, which the
 * reader of the trace supplies; without them no item reads as out of date.
 */
export function useArtifactOutline(
  artifactId: string | undefined,
  { outOfDateIds }: { outOfDateIds?: ReadonlySet<string> } = {},
): ArtifactOutlineResult {
  const artifact = useArtifact(artifactId ?? '', undefined, { isEnabled: artifactId !== undefined })
  const { schema, isError: isSchemaError, retry: retrySchema } = useItemSchema(artifact.data)
  const issueKinds = useIssueKinds()
  const outline = useOutlineItems(artifactId)

  const success = outline.state === 'success' ? outline : undefined
  const nodes = useMemo(
    () =>
      artifact.data === undefined || success === undefined || issueKinds.data === undefined
        ? []
        : artifactOutline({
            artifact: artifact.data,
            artifactSchema: schema,
            items: success.items,
            itemKinds: success.itemKinds,
            kinds: success.kinds,
            issueKinds: issueKinds.data,
            ...(outOfDateIds !== undefined && { outOfDateIds }),
          }),
    [artifact.data, schema, success, issueKinds.data, outOfDateIds],
  )
  const statuses = useMemo(() => outlineStatuses(nodes), [nodes])
  const artifactData = artifact.data
  // One result for the same data, so that what reads it computes again only when the data changes.
  const result = useMemo<ArtifactOutlineResult | undefined>(
    () =>
      artifactData === undefined || success === undefined
        ? undefined
        : {
            state: 'success',
            artifact: artifactData,
            items: success.items,
            kinds: success.kinds,
            nodes,
            statuses,
          },
    [artifactData, success, nodes, statuses],
  )

  if (outline.state === 'error') return { state: 'error', retry: outline.retry }
  if (isSchemaError || issueKinds.isError) {
    return {
      state: 'error',
      retry: () => {
        void issueKinds.refetch()
        retrySchema()
      },
    }
  }
  if (result === undefined || issueKinds.data === undefined) return { state: 'pending' }
  return result
}
