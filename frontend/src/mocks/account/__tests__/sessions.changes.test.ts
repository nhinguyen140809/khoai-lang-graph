import { describe, expect, it } from 'vitest'

import { sessionIds } from '../../shared/db'
import { addCurrentSession, removeOtherSessions, removeSession } from '../sessions.changes'
import { activeSessions, allSessions } from '../sessions.lookup'

describe('removeSession', () => {
  it('sets revoked_at and updated_at of the session', () => {
    removeSession(sessionIds.phone)

    const phone = allSessions().find(({ id }) => id === sessionIds.phone)
    expect(phone?.revoked_at).not.toBeNull()
    expect(phone?.updated_at).toBe(phone?.revoked_at)
  })
})

describe('removeOtherSessions', () => {
  it('keeps the session of this browser only', () => {
    removeOtherSessions()

    expect(activeSessions().map(({ id }) => id)).toEqual([sessionIds.current])
  })
})

describe('addCurrentSession', () => {
  it('brings the session of this browser back', () => {
    removeSession(sessionIds.current)

    addCurrentSession()

    expect(activeSessions().map(({ id }) => id)).toContain(sessionIds.current)
  })
})
