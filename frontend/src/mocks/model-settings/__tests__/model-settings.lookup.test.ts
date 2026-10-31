import { describe, expect, it } from 'vitest'

import { changeModelSettings } from '../model-settings.changes'
import { allModelSettings, findModelSetting, modelsOfUserSettings } from '../model-settings.lookup'

describe('allModelSettings', () => {
  it('lists the fixtures by agent role until a change', () => {
    expect(allModelSettings().map(({ agent_role: role }) => role)).toEqual([
      'analyst',
      'persona_agent',
    ])
  })

  it('lists the change after it', () => {
    changeModelSettings([
      { agent_role: 'validator', model_id: 'openai:gpt-4.1', temperature: null },
    ])

    expect(allModelSettings().map(({ agent_role: role }) => role)).toEqual(['validator'])
  })
})

describe('findModelSetting', () => {
  it('finds the setting of a role, or none for a role on the default', () => {
    expect(findModelSetting('persona_agent')?.temperature).toBe(0.8)
    expect(findModelSetting('planner')).toBeUndefined()
  })
})

describe('modelsOfUserSettings', () => {
  it('gives the model of each role that has a setting', () => {
    expect(modelsOfUserSettings()).toEqual({
      analyst: 'anthropic:claude-opus-5',
      persona_agent: 'openai:gpt-4.1-mini',
    })
  })
})
