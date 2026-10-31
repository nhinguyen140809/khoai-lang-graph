import type { Me } from '@/modules/user/entities'

import { userId } from '../shared/db'

export const meFixture: Me = {
  id: userId,
  email: 'linh.pham@example.com',
  display_name: 'Linh Pham',
  avatar_url: null,
  role: 'user',
  status: 'active',
  email_verified_at: '2026-09-01T08:00:00Z',
  last_login_at: '2026-10-06T08:20:00Z',
  monthly_budget_usd: null,
  created_at: '2026-09-01T08:00:00Z',
  updated_at: '2026-10-06T08:20:00Z',
}

/** The password of the user of the examples, which a change of the password checks. */
export const mePasswordFixture = 'correct-horse-7'
