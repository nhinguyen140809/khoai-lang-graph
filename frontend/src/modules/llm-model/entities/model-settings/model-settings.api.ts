import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { apiRequest, fetchAllPages, listPageSchema } from '@/shared/api/request'

import { modelSettingsPageSize } from './model-settings.constants'
import {
  type ModelSetting,
  modelSettingSchema,
  type ReplaceModelSettingsBody,
} from './model-settings.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** The model that the user chose for each agent role, ordered by `agent_role`. */
export function listModelSettings(): Promise<ModelSetting[]> {
  return fetchAllPages(apiEndpoints.modelSettings.path(), modelSettingSchema, {
    limit: modelSettingsPageSize,
    action: 'load your model settings',
  })
}

/**
 * Replaces the model settings of the user and gives them as they are saved. The answer holds one
 * row per role, fewer than a page.
 */
export async function replaceModelSettings(
  body: ReplaceModelSettingsBody,
): Promise<ModelSetting[]> {
  const page = await apiRequest(
    apiEndpoints.modelSettings.path(),
    listPageSchema(modelSettingSchema),
    { action: 'save your model settings', method: HttpMethod.Put, body },
  )
  return page.items
}
