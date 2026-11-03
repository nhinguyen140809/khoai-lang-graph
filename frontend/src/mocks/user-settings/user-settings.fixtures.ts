import type { Me, UserSettings } from '@/modules/user/entities'

import { userId } from '../shared/db'

/**
 * The settings of the user of the examples, who has saved some: a dark theme, runs of 60 steps at
 * most.
 */
export const userSettingsFixture: UserSettings = {
  user_id: userId,
  theme: 'dark',
  ui_language: 'en',
  default_output_language: 'en',
  default_run_config: {
    review_checkpoints: null,
    max_steps: 60,
    max_cost_usd: null,
    parameters: null,
  },
  notify_on_interrupt: true,
  notify_on_run_finished: false,
  created_at: '2026-09-01T08:00:00Z',
  updated_at: '2026-10-01T09:00:00Z',
}

/** The settings of a user who has saved none, created with the account. */
export function defaultUserSettings(user: Me): UserSettings {
  return {
    user_id: user.id,
    theme: 'system',
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
    created_at: user.created_at,
    updated_at: user.created_at,
  }
}
