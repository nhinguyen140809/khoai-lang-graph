'use client'

import { EmptyState, ErrorState, LoadingState } from '@/components/state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNow } from '@/hooks/useNow'
import { formatRelativeTime } from '@/lib/relative-time.utils'

import { useRevokeSession, useSessions } from '../hooks/useAccountQueries'

/** The places where the user is signed in; each other one can be signed out. */
export function SessionsList() {
  const sessions = useSessions()
  const revoke = useRevokeSession()
  const now = useNow()

  if (sessions.isPending) return <LoadingState label="Loading your sessions" rows={3} />
  if (sessions.isError) {
    return <ErrorState message={sessions.error.message} onRetry={() => void sessions.refetch()} />
  }
  if (sessions.data.length === 0) return <EmptyState title="No session" size="compact" />

  return (
    <ul aria-label="Login sessions" className="flex max-w-xl flex-col gap-2">
      {sessions.data.map((session) => (
        <li key={session.id} className="flex items-center gap-3 rounded-md border p-3 text-xs">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex items-center gap-2 font-medium">
              {session.user_agent}
              {session.current && (
                <Badge variant="soft" color="success">
                  This device
                </Badge>
              )}
            </span>
            <span className="text-muted-foreground">
              {session.ip_address} - last used {formatRelativeTime(session.last_used_at, now)}
            </span>
          </div>
          {!session.current && (
            <Button
              size="sm"
              variant="outline"
              aria-label={`Sign out ${session.user_agent}`}
              disabled={revoke.isPending}
              onClick={() => {
                revoke.mutate(session.id)
              }}
            >
              Sign out
            </Button>
          )}
        </li>
      ))}
      {revoke.isError && (
        <p role="alert" className="text-xs text-destructive">
          {revoke.error.message}
        </p>
      )}
    </ul>
  )
}
