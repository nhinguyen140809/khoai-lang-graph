import type { ModelSetting } from '@/modules/llm-model/entities'

import { IdPrefix, mockId, userId } from '../shared/db'
import { workflowDefinitionFixture } from '../workflow/workflow.fixtures'

// The model settings of the mock data: the user chose a model for the analyst and for the persona
// agent; every other role uses the server default.

/** The id of the row of a role: its place among the agent roles of the definition, from 1. */
export function modelSettingId(role: string): string {
  const place = workflowDefinitionFixture.agent_roles.findIndex(({ key }) => key === role)
  return mockId(IdPrefix.ModelSetting, place + 1)
}

export function buildModelSetting(role: string, fields: Partial<ModelSetting>): ModelSetting {
  return {
    id: modelSettingId(role),
    user_id: userId,
    agent_role: role,
    model_id: 'anthropic:claude-sonnet-5',
    temperature: null,
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-01T09:00:00Z',
    ...fields,
  }
}

export const modelSettingFixtures: ModelSetting[] = [
  buildModelSetting('analyst', { model_id: 'anthropic:claude-opus-5' }),
  buildModelSetting('persona_agent', { model_id: 'openai:gpt-4.1-mini', temperature: 0.8 }),
]
