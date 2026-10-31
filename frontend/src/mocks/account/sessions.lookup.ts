import type { Session } from '@/modules/user/entities'

import { sessionFixtures } from './sessions.fixtures'
import { revokedSessions } from './sessions.store'

// The sessions of the user as the mock server holds them now: the fixtures, with the sessions that
// were revoked since. The expiry is not modelled: only a revoked session leaves the list.

/** Every session of the user, the revoked ones too. */
export function allSessions(): Session[] {
  const revoked = revokedSessions.get()
  return sessionFixtures.map((session) => {
    const revokedAt = revoked[session.id]
    return revokedAt === undefined
      ? session
      : { ...session, revoked_at: revokedAt, updated_at: revokedAt }
  })
}

/** The sessions that are not revoked, the last seen first. */
export function activeSessions(): Session[] {
  return allSessions()
    .filter(({ revoked_at: revokedAt }) => revokedAt === null)
    .toSorted((a, b) => b.last_seen_at.localeCompare(a.last_seen_at) || a.id.localeCompare(b.id))
}

/** A session that is not revoked, or undefined for a revoked or unknown id. */
export function findActiveSession(id: string): Session | undefined {
  return activeSessions().find((session) => session.id === id)
}
