import { useQuery } from '@tanstack/react-query'

import { getArtifactKinds } from '../artifacts.api'

/** The kinds and content schemas of the workflow. */
export function useArtifactKinds() {
  return useQuery({
    queryKey: ['artifacts', 'kinds'],
    queryFn: () => getArtifactKinds(),
    staleTime: Number.POSITIVE_INFINITY,
  })
}
