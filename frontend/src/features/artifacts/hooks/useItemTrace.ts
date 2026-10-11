import { useQuery } from '@tanstack/react-query'

import { getItemTrace } from '../artifacts.api'

/** The chain of the item (TRACE panel). */
export function useItemTrace(itemId: string) {
  return useQuery({
    queryKey: ['artifacts', 'trace', itemId],
    queryFn: () => getItemTrace(itemId),
  })
}
