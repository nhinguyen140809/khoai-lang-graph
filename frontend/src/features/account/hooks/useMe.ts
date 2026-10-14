import { useQuery } from '@tanstack/react-query'

import { getMe } from '../account.api'
import { accountKeys } from '../account.keys'

/** The signed-in user. */
export function useMe() {
  return useQuery({ queryKey: accountKeys.me(), queryFn: getMe })
}
