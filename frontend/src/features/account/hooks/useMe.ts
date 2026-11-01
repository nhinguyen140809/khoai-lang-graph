import { useQuery } from '@tanstack/react-query'

import { getMe } from '../account.api'
import { accountKeys } from '../account.keys'

// The user changes rarely, so the parts of a page that show them, such as the items of the account
// menu, share one answer for five minutes. What changes the user invalidates `accountKeys.all()`,
// so that the change shows at once.
const ME_STALE_TIME = 5 * 60_000

/** The signed-in user. */
export function useMe() {
  return useQuery({ queryKey: accountKeys.me(), queryFn: getMe, staleTime: ME_STALE_TIME })
}
