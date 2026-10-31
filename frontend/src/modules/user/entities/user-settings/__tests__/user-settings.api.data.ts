import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import type { SentRequestCase } from '@/test/suites'

import { getUserSettings, replaceUserSettings } from '../user-settings.api'
import type { ReplaceUserSettingsBody } from '../user-settings.types'

const path = apiEndpoints.userSettings.path()

export const replaceBody: ReplaceUserSettingsBody = { theme: 'light' }

/** A call of the settings API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'reads the settings',
    call: () => getUserSettings(),
    request: { method: 'GET', path, body: null },
  },
  {
    name: 'saves the settings with the body',
    call: () => replaceUserSettings(replaceBody),
    request: { method: 'PUT', path, body: replaceBody },
  },
] satisfies SentRequestCase[]

/** A call of the settings API, the handler that refuses it, and the error it throws. */
export const apiErrorCases = [
  {
    name: 'a failed read of the settings',
    refuse: () => serverErrorOn(HttpMethod.Get, path),
    call: () => getUserSettings(),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to load your settings (HTTP 500)',
    },
  },
  {
    name: 'a failed save of the settings',
    refuse: () => serverErrorOn(HttpMethod.Put, path),
    call: () => replaceUserSettings(replaceBody),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to save your settings (HTTP 500)',
    },
  },
  {
    name: 'a theme that the API refuses',
    refuse: () =>
      http.put(apiEndpoints.userSettings.pattern, () =>
        HttpResponse.json(
          {
            status: HttpStatus.UnprocessableContent,
            code: 'validation_failed',
            errors: [{ field: 'theme', message: 'Choose one of the values.' }],
          },
          { status: HttpStatus.UnprocessableContent },
        ),
      ),
    call: () => replaceUserSettings(replaceBody),
    error: {
      status: HttpStatus.UnprocessableContent,
      code: 'validation_failed',
      fieldErrors: [{ field: 'theme', message: 'Choose one of the values.' }],
    },
  },
]
