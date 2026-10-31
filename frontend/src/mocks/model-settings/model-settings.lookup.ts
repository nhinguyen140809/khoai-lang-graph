import type { ModelSetting } from '@/modules/llm-model/entities'

import { modelSettingFixtures } from './model-settings.fixtures'
import { replacedModelSettings } from './model-settings.store'

// The model settings of the user as the mock server holds them now: the fixtures, until a PUT
// replaces them.

/** Every model setting of the user, ordered by `agent_role`. */
export function allModelSettings(): ModelSetting[] {
  return (replacedModelSettings.get() ?? modelSettingFixtures).toSorted((a, b) =>
    a.agent_role.localeCompare(b.agent_role),
  )
}

/** The setting of an agent role, or undefined for a role on the server default. */
export function findModelSetting(role: string): ModelSetting | undefined {
  return allModelSettings().find(({ agent_role: agentRole }) => agentRole === role)
}

/** The model that the user chose for each agent role, by role. */
export function modelsOfUserSettings(): Record<string, string> {
  return Object.fromEntries(
    allModelSettings().map(({ agent_role: role, model_id: modelId }) => [role, modelId]),
  )
}
