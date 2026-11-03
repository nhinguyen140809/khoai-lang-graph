import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import type { SentRequestCase } from '@/test/suites'

import { listModelSettings, replaceModelSettings } from '../model-settings.api'
import type { ReplaceModelSettingsBody } from '../model-settings.types'

const path = apiEndpoints.modelSettings.path()

export const replaceBody: ReplaceModelSettingsBody = {
  items: [{ agent_role: 'analyst', model_id: 'openai:gpt-4.1', temperature: 0.3 }],
}

/** A call of the model settings API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'lists the model settings in the largest pages',
    call: () => listModelSettings(),
    request: { method: 'GET', path: `${path}?limit=200`, body: null },
  },
  {
    name: 'replaces the model settings with the body',
    call: () => replaceModelSettings(replaceBody),
    request: { method: 'PUT', path, body: replaceBody },
  },
] satisfies SentRequestCase[]

/** A call of the model settings API, the handler that refuses it, and the error it throws. */
export const apiErrorCases = [
  {
    name: 'a failed read of the model settings',
    refuse: () => serverErrorOn(HttpMethod.Get, path),
    call: () => listModelSettings(),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to load your model settings (HTTP 500)',
    },
  },
  {
    name: 'a failed save of the model settings',
    refuse: () => serverErrorOn(HttpMethod.Put, path),
    call: () => replaceModelSettings(replaceBody),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to save your model settings (HTTP 500)',
    },
  },
  {
    name: 'settings that the API refuses',
    refuse: () =>
      http.put(apiEndpoints.modelSettings.pattern, () =>
        HttpResponse.json(
          {
            status: HttpStatus.UnprocessableContent,
            code: 'validation_failed',
            errors: [{ field: 'items.0.model_id', message: 'Choose one of the values.' }],
          },
          { status: HttpStatus.UnprocessableContent },
        ),
      ),
    call: () => replaceModelSettings(replaceBody),
    error: {
      status: HttpStatus.UnprocessableContent,
      code: 'validation_failed',
      fieldErrors: [{ field: 'items.0.model_id', message: 'Choose one of the values.' }],
    },
  },
]
