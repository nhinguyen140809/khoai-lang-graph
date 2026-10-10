import { apiRequest } from '@/lib/api-fetch.utils'

import { type UserSettings, userSettingsSchema } from './settings.types'

// TODO: switch to the generated client in src/api/generated/ once it is generated.

export function getUserSettings(): Promise<UserSettings> {
  return apiRequest('/api/v1/me/settings', userSettingsSchema, { action: 'load your settings' })
}

/** The fields of the settings that the client sends; the server keeps the others. */
export type UserSettingsBody = Pick<
  UserSettings,
  | 'theme'
  | 'ui_language'
  | 'default_output_language'
  | 'default_run_config'
  | 'notify_on_interrupt'
  | 'notify_on_run_finished'
>

/** Replaces the settings of the user. */
export function replaceUserSettings(body: UserSettingsBody): Promise<UserSettings> {
  return apiRequest('/api/v1/me/settings', userSettingsSchema, {
    action: 'save your settings',
    method: 'PUT',
    body,
  })
}
