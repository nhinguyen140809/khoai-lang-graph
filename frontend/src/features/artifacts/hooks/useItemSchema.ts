import { useQuery } from '@tanstack/react-query'

import { getContentSchema } from '../artifacts.api'
import type { ArtifactItem, ContentSchema } from '../artifacts.types'
import { artifactKeys } from '../artifacts-keys.constants'
import { useArtifactKinds } from './useArtifactKinds'

/**
 * The content schema that an item follows: the current one of its kind when the item was written
 * with it, else the schema of the version it was written with.
 */
export function useItemSchema(item: ArtifactItem | undefined): {
  schema: ContentSchema | undefined
  isPending: boolean
} {
  const kinds = useArtifactKinds()
  const current = kinds.data?.artifact_kinds
    .flatMap((artifactKind) => artifactKind.item_kinds)
    .find((itemKind) => itemKind.kind === item?.kind)
  const sameVersion = current !== undefined && current.schema_version === item?.schema_version
  const older = useQuery({
    queryKey: artifactKeys.schema(item?.kind ?? '', item?.schema_version ?? 0),
    queryFn: () => getContentSchema(item?.kind ?? '', item?.schema_version ?? 0),
    enabled: item !== undefined && kinds.isSuccess && !sameVersion,
    staleTime: Infinity,
  })
  if (sameVersion) return { schema: current.schema, isPending: false }
  return { schema: older.data, isPending: kinds.isPending || older.isPending }
}
