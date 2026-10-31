import { describe, expect, it } from 'vitest'

import { changeModelSettings } from '../model-settings.changes'
import { modelSettingId } from '../model-settings.fixtures'
import { allModelSettings, findModelSetting } from '../model-settings.lookup'

const fixtureTime = '2026-10-01T09:00:00Z'

describe('changeModelSettings', () => {
  it('keeps the id and the creation time of a role that had a row', () => {
    changeModelSettings([{ agent_role: 'analyst', model_id: 'openai:gpt-4.1', temperature: 0.2 }])

    expect(findModelSetting('analyst')).toMatchObject({
      id: modelSettingId('analyst'),
      created_at: fixtureTime,
      model_id: 'openai:gpt-4.1',
      temperature: 0.2,
    })
    expect(findModelSetting('analyst')?.updated_at).not.toBe(fixtureTime)
  })

  it('changes the update time of a row only when the row changes', () => {
    changeModelSettings([
      { agent_role: 'analyst', model_id: 'anthropic:claude-opus-5', temperature: null },
    ])

    expect(findModelSetting('analyst')?.updated_at).toBe(fixtureTime)
  })

  it('gives a new role the id of its place among the agent roles', () => {
    changeModelSettings([
      { agent_role: 'planner', model_id: 'anthropic:claude-haiku-5', temperature: null },
    ])

    const planner = findModelSetting('planner')
    expect(planner?.id).toBe(modelSettingId('planner'))
    expect(planner?.created_at).toBe(planner?.updated_at)
    expect(modelSettingId('planner')).not.toBe(modelSettingId('analyst'))
  })

  it('drops a role left out', () => {
    changeModelSettings([
      { agent_role: 'analyst', model_id: 'anthropic:claude-opus-5', temperature: null },
    ])

    expect(allModelSettings().map(({ agent_role: role }) => role)).toEqual(['analyst'])
  })
})
