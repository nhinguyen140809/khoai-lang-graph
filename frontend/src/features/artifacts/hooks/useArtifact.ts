import { useQuery } from '@tanstack/react-query'

import { getArtifact } from '../artifacts.api'
import { artifactKeys } from '../artifacts.keys'

export function useArtifact(artifactId: string) {
  return useQuery({
    queryKey: artifactKeys.artifact(artifactId),
    queryFn: () => getArtifact(artifactId),
  })
}
