import type { Me } from '@/features/account'
import type { UserSettings } from '@/features/settings'

import { USER_ID } from '../shared/mock-ids.constants'

export const mockMe: Me = {
  id: USER_ID,
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

export const mockUserSettings: UserSettings = {
  user_id: USER_ID,
  theme: 'dark',
  ui_language: 'en',
  default_output_language: 'en',
  default_run_config: {
    review_checkpoints: null,
    max_steps: null,
    max_cost_usd: null,
    parameters: null,
  },
  notify_on_interrupt: true,
  notify_on_run_finished: true,
  created_at: '2026-09-01T08:00:00Z',
  updated_at: '2026-09-01T08:00:00Z',
}
