import { useQuery } from '@tanstack/react-query'

import { minuteMs } from '@/shared/lib/time'

import { getMe } from '../user.api'
import { userKeys } from '../user.keys'

// The user changes rarely, so the parts of a page that show them, such as the items of the account
// menu, share one answer for five minutes. A mutation that changes the user invalidates
// `userKeys.all()`, so that the change shows at once.
const ME_STALE_TIME = 5 * minuteMs

/** The signed-in user. */
export function useMe() {
  return useQuery({ queryKey: userKeys.me(), queryFn: getMe, staleTime: ME_STALE_TIME })
}
