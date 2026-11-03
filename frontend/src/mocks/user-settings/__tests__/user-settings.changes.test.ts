import { describe, expect, it } from 'vitest'

import { meFixture } from '../../account/me.fixtures'
import { changeUserSettings, resetUserSettings } from '../user-settings.changes'
import { userSettingsFixture } from '../user-settings.fixtures'
import { currentUserSettings } from '../user-settings.lookup'

describe('changeUserSettings', () => {
  it('changes the fields given and keeps the others', () => {
    changeUserSettings({ theme: 'light' })

    expect(currentUserSettings()).toMatchObject({
      theme: 'light',
      ui_language: userSettingsFixture.ui_language,
      default_run_config: userSettingsFixture.default_run_config,
    })
    expect(currentUserSettings().updated_at).not.toBe(userSettingsFixture.updated_at)
  })

  it('keeps updated_at when no value changes', () => {
    changeUserSettings({ theme: userSettingsFixture.theme })

    expect(currentUserSettings().updated_at).toBe(userSettingsFixture.updated_at)
  })
})

describe('resetUserSettings', () => {
  it('writes the defaults, created with the account', () => {
    resetUserSettings()

    expect(currentUserSettings()).toMatchObject({
      user_id: meFixture.id,
      theme: 'system',
      created_at: meFixture.created_at,
      updated_at: meFixture.created_at,
    })
  })
})
