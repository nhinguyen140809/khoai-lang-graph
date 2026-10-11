import { useQuery } from '@tanstack/react-query'

import { listModels } from '../project-settings.api'

export function useModels() {
  return useQuery({
    queryKey: ['project-settings', 'models'],
    queryFn: listModels,
    staleTime: 5 * 60_000,
  })
}
