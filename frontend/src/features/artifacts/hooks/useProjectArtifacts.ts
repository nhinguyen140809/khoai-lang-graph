import { useQuery } from '@tanstack/react-query'

import { listProjectArtifacts } from '../artifacts.api'

/** The artifacts of the project, the roots of the Artifacts tree. */
export function useProjectArtifacts(projectId: string) {
  return useQuery({
    queryKey: ['artifacts', 'project', projectId],
    queryFn: () => listProjectArtifacts(projectId),
  })
}
