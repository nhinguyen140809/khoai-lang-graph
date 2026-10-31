import type { Session } from '@/modules/user/entities'

import { sessionIds, userId } from '../shared/db'

// The sessions of the user of the examples: three that are active and one that was revoked. A
// session expires 60 days after it was last seen.

function buildSession(id: string, fields: Partial<Session>): Session {
  const lastSeenAt = fields.last_seen_at ?? '2026-10-06T09:41:00Z'
  return {
    id,
    user_id: userId,
    expires_at: '2026-12-05T09:41:00Z',
    last_seen_at: lastSeenAt,
    user_agent: null,
    ip_address: null,
    revoked_at: null,
    current: false,
    created_at: '2026-10-06T08:20:00Z',
    updated_at: fields.revoked_at ?? lastSeenAt,
    ...fields,
  }
}

export const sessionFixtures: Session[] = [
  buildSession(sessionIds.current, {
    user_agent: 'Chrome 141 on Windows 11',
    ip_address: '203.0.113.24',
    current: true,
  }),
  buildSession(sessionIds.phone, {
    user_agent: 'Safari 19 on iPhone',
    ip_address: '198.51.100.7',
    created_at: '2026-10-03T19:02:00Z',
    last_seen_at: '2026-10-05T21:15:00Z',
    expires_at: '2026-12-04T21:15:00Z',
  }),
  buildSession(sessionIds.laptop, {
    user_agent: 'Firefox 143 on Ubuntu',
    created_at: '2026-09-21T07:45:00Z',
    last_seen_at: '2026-09-30T10:03:00Z',
    expires_at: '2026-11-29T10:03:00Z',
  }),
  buildSession(sessionIds.revoked, {
    user_agent: 'Edge 140 on Windows 11',
    ip_address: '203.0.113.80',
    created_at: '2026-09-10T12:00:00Z',
    last_seen_at: '2026-09-12T18:30:00Z',
    expires_at: '2026-11-11T18:30:00Z',
    revoked_at: '2026-09-12T18:31:00Z',
  }),
]
