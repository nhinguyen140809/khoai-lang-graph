import { useQuery } from '@tanstack/react-query'

import { getMe } from '../account.api'

export function useMe() {
  return useQuery({ queryKey: ['account', 'me'], queryFn: getMe })
}
