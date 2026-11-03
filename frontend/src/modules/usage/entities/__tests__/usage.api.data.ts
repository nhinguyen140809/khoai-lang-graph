import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import type { SentRequestCase } from '@/test/suites'

import { getMonthlyUsage } from '../usage.api'

const path = apiEndpoints.usage.path()

/** A call of the usage API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'reads the current month without a query',
    call: () => getMonthlyUsage(),
    request: { method: 'GET', path, body: null },
  },
  {
    name: 'reads a month grouped by model',
    call: () => getMonthlyUsage({ month: '2026-09', groupBy: 'model' }),
    request: { method: 'GET', path: `${path}?month=2026-09&group_by=model`, body: null },
  },
] satisfies SentRequestCase[]

/** A call of the usage API, the handler that refuses it, and the message of the error. */
export const apiErrorCases = [
  {
    name: 'a failed read of the usage',
    refuse: () => serverErrorOn(HttpMethod.Get, path),
    call: () => getMonthlyUsage(),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to load your usage (HTTP 500)',
    },
  },
]
