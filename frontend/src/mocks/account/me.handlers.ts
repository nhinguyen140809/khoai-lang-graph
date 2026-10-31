import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { readBodyFields } from '../shared/http/request'
import { noContent, validationFailed } from '../shared/http/response'
import { answerScenario } from '../shared/scenario'
import { currentUser } from './account.store'
import { changeMe, changeStoredPassword } from './me.changes'
import { userNotFound } from './me.problems'
import { validateChangePasswordBody, validateUpdateMeBody } from './me.validators'

export const meHandlers = [
  http.get(apiEndpoints.me.pattern, async () => {
    const scenario = await answerScenario('me')
    return scenario === 'empty' ? userNotFound() : HttpResponse.json(currentUser.get())
  }),

  http.patch(apiEndpoints.me.pattern, async ({ request }) => {
    await answerScenario('update-me')
    const checked = validateUpdateMeBody(await readBodyFields(request))
    if ('problems' in checked) return validationFailed(checked.problems)
    changeMe(checked.fields)
    return HttpResponse.json(currentUser.get())
  }),

  http.post(apiEndpoints.password.pattern, async ({ request }) => {
    await answerScenario('change-password')
    const checked = validateChangePasswordBody(await readBodyFields(request))
    if ('problems' in checked) return validationFailed(checked.problems)
    changeStoredPassword(checked.password)
    return noContent()
  }),
]
