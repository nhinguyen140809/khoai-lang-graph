import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { currentUser } from '../account/account.store'
import { readBodyFields } from '../shared/http/request'
import { validationFailed } from '../shared/http/response'
import { answerScenario } from '../shared/scenario'
import { changeUserSettings } from './user-settings.changes'
import { defaultUserSettings } from './user-settings.fixtures'
import { currentUserSettings } from './user-settings.lookup'
import { validateUserSettingsBody } from './user-settings.validators'

export const userSettingHandlers = [
  http.get(apiEndpoints.userSettings.pattern, async () => {
    const scenario = await answerScenario('user-settings')
    // A user who has saved none gets the defaults.
    if (scenario === 'empty') return HttpResponse.json(defaultUserSettings(currentUser.get()))
    return HttpResponse.json(currentUserSettings())
  }),

  // A PUT gives the same result when it repeats, so it needs no idempotency key.
  http.put(apiEndpoints.userSettings.pattern, async ({ request }) => {
    await answerScenario('replace-user-settings')
    const checked = validateUserSettingsBody(await readBodyFields(request))
    if ('problems' in checked) return validationFailed(checked.problems)
    changeUserSettings(checked.fields)
    return HttpResponse.json(currentUserSettings())
  }),
]
