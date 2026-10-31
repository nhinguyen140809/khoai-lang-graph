import type { ReplaceModelSettingsBody } from '@/modules/llm-model/entities'

import { mockNow, userId } from '../shared/db'
import { modelSettingId } from './model-settings.fixtures'
import { findModelSetting } from './model-settings.lookup'
import { replacedModelSettings } from './model-settings.store'

/**
 * Replaces the model settings of the user with one row per choice. A role that had a row keeps its
 * `created_at`, and its `updated_at` changes only when the row does; a role left out is dropped.
 */
export function changeModelSettings(choices: ReplaceModelSettingsBody['items']) {
  const now = mockNow()
  replacedModelSettings.set(
    choices.map(({ agent_role: role, model_id: modelId, temperature }) => {
      const before = findModelSetting(role)
      const isChanged = before?.model_id !== modelId || before.temperature !== temperature
      return {
        id: modelSettingId(role),
        user_id: userId,
        agent_role: role,
        model_id: modelId,
        temperature,
        created_at: before?.created_at ?? now,
        updated_at: before === undefined || isChanged ? now : before.updated_at,
      }
    }),
  )
}
