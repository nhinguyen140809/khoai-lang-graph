import { useQuery } from '@tanstack/react-query'

import { listArtifactItems } from '../artifacts.api'
import { artifactKeys } from '../artifacts.keys'

/** The items of an artifact in outline order; `enabled` waits until they are needed. */
export function useArtifactItems(artifactId: string, enabled = true) {
  return useQuery({
    queryKey: artifactKeys.items(artifactId),
    queryFn: () => listArtifactItems(artifactId),
    enabled,
  })
}
