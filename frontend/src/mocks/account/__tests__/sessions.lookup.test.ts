import { describe, expect, it } from 'vitest'

import { sessionIds } from '../../shared/db'
import { removeSession } from '../sessions.changes'
import { activeSessions, allSessions, findActiveSession } from '../sessions.lookup'

describe('activeSessions', () => {
  it('lists the sessions that are not revoked, the last seen first', () => {
    expect(activeSessions().map(({ id }) => id)).toEqual([
      sessionIds.current,
      sessionIds.phone,
      sessionIds.laptop,
    ])
  })

  it('leaves out a session once it is revoked', () => {
    removeSession(sessionIds.laptop)

    expect(activeSessions().map(({ id }) => id)).toEqual([sessionIds.current, sessionIds.phone])
    expect(allSessions()).toHaveLength(4)
  })
})

describe('findActiveSession', () => {
  it('finds an active session', () => {
    expect(findActiveSession(sessionIds.phone)?.id).toBe(sessionIds.phone)
  })

  it.each([
    { name: 'a revoked session', id: sessionIds.revoked },
    { name: 'an unknown id', id: 'no-such-session' },
  ])('finds nothing for $name', ({ id }) => {
    expect(findActiveSession(id)).toBeUndefined()
  })
})
