import { useQuery } from '@tanstack/react-query'

import { listItemRevisions } from '../artifacts.api'
import { artifactKeys } from '../artifacts-keys.constants'

export function useItemRevisions(itemId: string) {
  return useQuery({
    queryKey: artifactKeys.revisions(itemId),
    queryFn: () => listItemRevisions(itemId),
  })
}
