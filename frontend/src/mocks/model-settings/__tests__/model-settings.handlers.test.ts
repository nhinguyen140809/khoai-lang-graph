import { describe, expect, it } from 'vitest'

import type { ModelSetting } from '@/modules/llm-model/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import { getApiItems, openPage, putApi } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import { rejectedCases } from './model-settings.handlers.data'

const path = apiEndpoints.modelSettings.path()

describe('GET /me/model-settings', () => {
  it('answers the two rows of the user, by agent role', async () => {
    const items = await getApiItems<ModelSetting>(path)

    expect(items.map(({ agent_role: role }) => role)).toEqual(['analyst', 'persona_agent'])
  })

  it('answers no row in the empty scenario', async () => {
    openPage('/?mock-model-settings=empty')

    expect(await getApiItems<ModelSetting>(path)).toEqual([])
  })
})

describe('PUT /me/model-settings', () => {
  it('replaces the rows, and a later GET reads the change', async () => {
    const answered = await putApi(path, {
      items: [{ agent_role: 'planner', model_id: 'anthropic:claude-haiku-5', temperature: 0.4 }],
    })

    expect(answered.status).toBe(HttpStatus.Ok)
    const items = await getApiItems<ModelSetting>(path)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ agent_role: 'planner', temperature: 0.4 })
  })

  itRejectsRequests(rejectedCases)
})
