import { apiCommand, apiRequest, fetchAllPages, listPageSchema } from '@/shared/api/api-fetch.utils'
import { runConfigDefinitionSchema } from '@/shared/components/run-config'

import {
  catalogModelSchema,
  type ModelChoice,
  modelChoiceSchema,
  profileSchema,
  sessionSchema,
  type UsageGroup,
  usageSchema,
  type UserSettings,
  userSettingsSchema,
} from './settings.types'

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

const id = encodeURIComponent

export function changeProfile(body: { display_name: string; avatar_url: string | null }) {
  return apiRequest('/api/v1/me', profileSchema, {
    action: 'save your profile',
    method: 'PATCH',
    body,
  })
}

export function changePassword(body: { current_password: string; new_password: string }) {
  return apiCommand('/api/v1/me/password', { action: 'change your password', body })
}

export function listSessions() {
  return fetchAllPages('/api/v1/me/sessions', sessionSchema, 'load your sessions')
}

export function revokeSession(sessionId: string) {
  return apiCommand(`/api/v1/me/sessions/${id(sessionId)}`, {
    action: 'revoke the session',
    method: 'DELETE',
  })
}

export function listModelChoices() {
  return fetchAllPages('/api/v1/me/model-settings', modelChoiceSchema, 'load your models')
}

export function replaceModelChoices(items: ModelChoice[]) {
  return apiRequest('/api/v1/me/model-settings', listPageSchema(modelChoiceSchema), {
    action: 'save your models',
    method: 'PUT',
    body: { items },
  }).then((page) => page.items)
}

export function listCatalog() {
  return fetchAllPages('/api/v1/models', catalogModelSchema, 'load the models')
}

export function getUsage(groupBy: UsageGroup) {
  return apiRequest(`/api/v1/me/usage?group_by=${groupBy}`, usageSchema, {
    action: 'load your usage',
  })
}

/** The current version of the workflow definition. */
export function getCurrentDefinition() {
  return apiRequest('/api/v1/workflow/definition', runConfigDefinitionSchema, {
    action: 'load the workflow definition',
  })
}
