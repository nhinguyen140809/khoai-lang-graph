import { useQuery } from '@tanstack/react-query'

import type { HookQueryOptions } from '@/shared/api/query-client'

import { listSessions } from '../sessions.api'
import { sessionKeys } from '../sessions.keys'

/** The sessions of the user. Revoking one invalidates `sessionKeys.all()`. */
export function useSessions({ isEnabled = true }: HookQueryOptions = {}) {
  return useQuery({ queryKey: sessionKeys.list(), queryFn: listSessions, enabled: isEnabled })
}
