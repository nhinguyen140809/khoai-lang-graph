import { useQuery } from '@tanstack/react-query'

import { listThreads } from '../threads.api'

export const threadsQueryKey = ['threads'] as const

export function useThreads() {
  return useQuery({ queryKey: threadsQueryKey, queryFn: listThreads })
}
