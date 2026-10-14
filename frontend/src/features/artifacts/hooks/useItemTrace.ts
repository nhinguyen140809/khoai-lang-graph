import { useQuery } from '@tanstack/react-query'

import { getItemTrace } from '../artifacts.api'
import { artifactKeys } from '../artifacts.keys'

export function useItemTrace(itemId: string) {
  return useQuery({ queryKey: artifactKeys.trace(itemId), queryFn: () => getItemTrace(itemId) })
}
