import { describe, expect, it } from 'vitest'

import { itSendsRequests, itThrowsApiErrors } from '@/test/suites'

import { listModelSettings, replaceModelSettings } from '../model-settings.api'
import { apiErrorCases, replaceBody, sentRequestCases } from './model-settings.api.data'

describe('model settings api', () => {
  it('reads the two rows of the fixtures', async () => {
    const settings = await listModelSettings()

    expect(settings.map(({ agent_role: role }) => role)).toEqual(['analyst', 'persona_agent'])
  })

  it('reads only the row that a replace saved', async () => {
    const saved = await replaceModelSettings(replaceBody)

    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ agent_role: 'analyst', model_id: 'openai:gpt-4.1' })
    expect(await listModelSettings()).toEqual(saved)
  })

  itSendsRequests(sentRequestCases)

  itThrowsApiErrors(apiErrorCases)
})
