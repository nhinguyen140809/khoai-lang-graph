import { useQuery } from '@tanstack/react-query'

import { listItemRevisions } from '../artifacts.api'
import { artifactKeys } from '../artifacts.keys'

export function useItemRevisions(itemId: string) {
  return useQuery({
    queryKey: artifactKeys.revisions(itemId),
    queryFn: () => listItemRevisions(itemId),
  })
}
