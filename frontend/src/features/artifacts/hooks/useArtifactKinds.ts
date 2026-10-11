import { useQuery } from '@tanstack/react-query'

import { getArtifactKinds } from '../artifacts.api'
import { artifactKeys } from '../artifacts-keys.constants'

/** The content schemas of every kind; they change only with the workflow definition. */
export function useArtifactKinds() {
  return useQuery({
    queryKey: artifactKeys.kinds(),
    queryFn: getArtifactKinds,
    staleTime: 10 * 60_000,
  })
}
