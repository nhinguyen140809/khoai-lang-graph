import { describe, expect, it } from 'vitest'

import { userSettingsFixture } from '@/mocks/user-settings/user-settings.fixtures'
import { itSendsRequests, itThrowsApiErrors } from '@/test/suites'

import { getUserSettings, replaceUserSettings } from '../user-settings.api'
import { apiErrorCases, replaceBody, sentRequestCases } from './user-settings.api.data'

describe('user settings api', () => {
  it('reads the settings of the fixtures', async () => {
    await expect(getUserSettings()).resolves.toEqual(userSettingsFixture)
  })

  it('keeps the other settings when it saves one', async () => {
    const saved = await replaceUserSettings(replaceBody)

    expect(saved).toMatchObject({
      theme: 'light',
      ui_language: userSettingsFixture.ui_language,
      default_run_config: userSettingsFixture.default_run_config,
    })
    await expect(getUserSettings()).resolves.toEqual(saved)
  })

  itSendsRequests(sentRequestCases)

  itThrowsApiErrors(apiErrorCases)
})
