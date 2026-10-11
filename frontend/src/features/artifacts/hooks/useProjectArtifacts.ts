import { useQuery } from '@tanstack/react-query'

import { listProjectArtifacts } from '../artifacts.api'
import { artifactKeys } from '../artifacts-keys.constants'

export function useProjectArtifacts(projectId: string) {
  return useQuery({
    queryKey: artifactKeys.project(projectId),
    queryFn: () => listProjectArtifacts(projectId),
  })
}
