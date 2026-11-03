import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { apiRequest } from '@/shared/api/request'

import {
  type ReplaceUserSettingsBody,
  type UserSettings,
  userSettingsSchema,
} from './user-settings.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** The settings of the user, the defaults until the user saves some. */
export function getUserSettings(): Promise<UserSettings> {
  return apiRequest(apiEndpoints.userSettings.path(), userSettingsSchema, {
    action: 'load your settings',
  })
}

/** Saves the settings given, keeps the others, and gives the settings as saved. */
export function replaceUserSettings(body: ReplaceUserSettingsBody): Promise<UserSettings> {
  return apiRequest(apiEndpoints.userSettings.path(), userSettingsSchema, {
    action: 'save your settings',
    method: HttpMethod.Put,
    body,
  })
}
