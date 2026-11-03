import { mockNow, sessionIds } from '../shared/db'
import { activeSessions } from './sessions.lookup'
import { revokedSessions } from './sessions.store'

/** Revokes a session. */
export function removeSession(id: string) {
  revokedSessions.set({ ...revokedSessions.get(), [id]: mockNow() })
}

/** Revokes every active session but the one of this browser. */
export function removeOtherSessions() {
  for (const { id } of activeSessions()) {
    if (id !== sessionIds.current) removeSession(id)
  }
}

/** Brings the session of this browser back, as a new login does. */
export function addCurrentSession() {
  const others = Object.entries(revokedSessions.get()).filter(([id]) => id !== sessionIds.current)
  revokedSessions.set(Object.fromEntries(others))
}
