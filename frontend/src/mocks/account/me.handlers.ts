import { http, HttpResponse } from 'msw'

import type { UserSettings } from '@/features/settings'

import { mockRecord } from '../shared/mock-db.utils'
import { answerScenario, mockScenario, pageParam } from '../shared/mock-scenario.utils'
import { internalError, notFound, problem, validationFailed } from '../shared/problem.utils'
import { mockMe, mockUserSettings } from './me.fixtures'

/** The signed-in user; registering an account replaces it. */
export const meRecord = mockRecord('me', () => mockMe)

const settingsRecord = mockRecord('user-settings', () => mockUserSettings)

// The fields of the settings that PUT replaces; the others are kept by the server.
const settingsFields = [
  'theme',
  'ui_language',
  'default_output_language',
  'default_run_config',
  'notify_on_interrupt',
  'notify_on_run_finished',
] as const

export const meHandlers = [
  http.get('/api/v1/me', async () => {
    const scenario = mockScenario('me')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    return scenario === 'empty' ? notFound('The user') : HttpResponse.json(meRecord.get())
  }),

  http.get('/api/v1/me/settings', async () => {
    const scenario = mockScenario('settings')
    const answered = await answerScenario(scenario)
    if (answered !== null) return answered
    return scenario === 'empty' ? notFound('The settings') : HttpResponse.json(settingsRecord.get())
  }),

  http.put('/api/v1/me/settings', async ({ request }) => {
    // `?mock-settings=save-error` loads the settings but fails to save them.
    if (mockScenario('settings') === 'error' || pageParam('mock-settings') === 'save-error') {
      return internalError()
    }
    const body: unknown = await request.json().catch(() => null)
    if (typeof body !== 'object' || body === null) {
      return problem(400, 'invalid_request', 'Invalid request', 'The body is not a JSON object.')
    }
    const missing = settingsFields.filter((field) => !(field in body))
    if (missing.length > 0) {
      return validationFailed(missing.map((field) => ({ field, message: 'Required.' })))
    }
    const replaced: UserSettings = {
      ...settingsRecord.get(),
      ...(Object.fromEntries(
        settingsFields.map((field) => [field, (body as Record<string, unknown>)[field]]),
      ) as Pick<UserSettings, (typeof settingsFields)[number]>),
      updated_at: new Date().toISOString(),
    }
    settingsRecord.set(replaced)
    return HttpResponse.json(replaced)
  }),
]
