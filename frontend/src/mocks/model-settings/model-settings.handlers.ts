import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { readBodyFields } from '../shared/http/request'
import { emptyPage, paginate, validationFailed } from '../shared/http/response'
import { answerScenario } from '../shared/scenario'
import { changeModelSettings } from './model-settings.changes'
import { allModelSettings } from './model-settings.lookup'
import { validateModelSettings } from './model-settings.validators'

export const modelSettingHandlers = [
  http.get(apiEndpoints.modelSettings.pattern, async ({ request }) => {
    const scenario = await answerScenario('model-settings')
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    return HttpResponse.json(paginate(allModelSettings(), request))
  }),

  // A PUT gives the same result when it repeats, so it needs no idempotency key.
  http.put(apiEndpoints.modelSettings.pattern, async ({ request }) => {
    await answerScenario('replace-model-settings')
    const checked = validateModelSettings(await readBodyFields(request))
    if ('problems' in checked) return validationFailed(checked.problems)
    changeModelSettings(checked.choices)
    return HttpResponse.json(paginate(allModelSettings(), request))
  }),
]
