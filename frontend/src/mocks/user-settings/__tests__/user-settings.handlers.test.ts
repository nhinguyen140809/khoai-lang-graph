import { describe, expect, it } from 'vitest'

import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import { fetchApi, getApi, openPage, putApi } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import { userSettingsFixture } from '../user-settings.fixtures'
import { settingsRejectedCases } from './user-settings.handlers.data'

const path = apiEndpoints.userSettings.path()

describe('GET /me/settings', () => {
  it('answers the settings that the user saved', async () => {
    expect(await getApi(path)).toEqual(userSettingsFixture)
  })

  it('answers the defaults in the empty scenario', async () => {
    openPage('/?mock-user-settings=empty')

    expect(await getApi(path)).toMatchObject({
      theme: 'system',
      default_run_config: { max_steps: null },
      notify_on_run_finished: true,
    })
  })
})

describe('PUT /me/settings', () => {
  it('saves the fields given, keeps the others, and GET then reads them', async () => {
    const saved = await putApi(path, { theme: 'light' })

    expect(saved).toMatchObject({
      status: HttpStatus.Ok,
      body: { theme: 'light', ui_language: 'en', notify_on_run_finished: false },
    })
    expect((await fetchApi(path)).body).toEqual(saved.body)
  })

  itRejectsRequests(settingsRejectedCases)
})
