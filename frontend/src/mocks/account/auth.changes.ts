import { sessionIds } from '../shared/db'
import { sessionState } from './account.store'
import { addCurrentSession, removeSession } from './sessions.changes'

/** Logs the user in: the session of this browser is active again. */
export function logIn() {
  sessionState.set({ loggedIn: true })
  addCurrentSession()
}

/** Logs the user out: the session of this browser is revoked. */
export function logOut() {
  removeSession(sessionIds.current)
  sessionState.set({ loggedIn: false })
}
