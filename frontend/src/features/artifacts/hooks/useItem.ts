import { useQuery } from '@tanstack/react-query'

import { getItem } from '../artifacts.api'
import { artifactKeys } from '../artifacts.keys'

export function useItem(itemId: string) {
  return useQuery({ queryKey: artifactKeys.item(itemId), queryFn: () => getItem(itemId) })
}
