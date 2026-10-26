import { http, HttpResponse } from 'msw'

import type { Me } from '@/modules/user/entities'
import { apiBasePath, apiEndpoints, publicApiPaths } from '@/shared/api/endpoints'

import { mockState } from '../shared/db/mock-state.utils'
import { readBodyFields } from '../shared/http/request/request-body.utils'
import { unauthenticated, validationFailed } from '../shared/http/response/error-response.utils'
import { mockScenario, pendingForever } from '../shared/scenario/mock-scenario.utils'
import { meRecord } from './me.handlers'

// The session of the mock server: logged in until the user signs out.
const sessionRecord = mockState('session', () => ({ signedIn: true }))

// Endpoints that answer without a session.
const PUBLIC_PATHS = ['/api/v1/auth/register', '/api/v1/auth/login', '/api/v1/health']

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function missingFields(credentials: Record<string, unknown>, fields: string[]) {
  return fields
    .filter((field) => text(credentials[field]) === '')
    .map((field) => ({ field, message: 'Enter a value.' }))
}

export const authHandlers = [
  // Every other endpoint answers 401 without a session, as the API does. The handler matches only
  // then, so that a request with no handler of its own is still reported as unhandled.
  http.all(
    ({ request }) => {
      const { pathname } = new URL(request.url)
      return (
        pathname.startsWith(`${apiBasePath}/`) &&
        !publicApiPaths.includes(pathname) &&
        !sessionRecord.get().signedIn
      )
    },
    () => unauthenticated('Sign in to continue.'),
  ),

  http.post(apiEndpoints.login.pattern, async ({ request }) => {
    const scenario = mockScenario('login')
    if (scenario === 'loading') return pendingForever()
    const credentials = await readBodyFields(request)
    const missing = missingFields(credentials, ['email', 'password'])
    if (missing.length > 0) return validationFailed(missing)
    // The same answer for an unknown email and a wrong password.
    if (scenario === 'error') {
      return unauthenticated('The email or the password is wrong.')
    }
    sessionRecord.set({ signedIn: true })
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(apiEndpoints.register.pattern, async ({ request }) => {
    const scenario = mockScenario('register')
    if (scenario === 'loading') return pendingForever()
    const credentials = await readBodyFields(request)
    const missing = missingFields(credentials, ['email', 'password', 'display_name'])
    if (missing.length > 0) return validationFailed(missing)
    if (scenario === 'error') {
      return validationFailed([{ field: 'email', message: 'An account with this email exists.' }])
    }
    const now = new Date().toISOString()
    const me: Me = {
      ...meRecord.get(),
      email: text(credentials.email).toLowerCase(),
      display_name: text(credentials.display_name),
      created_at: now,
      updated_at: now,
    }
    meRecord.set(me)
    return HttpResponse.json(me, { status: 201, headers: { Location: apiEndpoints.me.path() } })
  }),

  http.post(apiEndpoints.logout.pattern, () => {
    sessionRecord.set({ signedIn: false })
    return new HttpResponse(null, { status: 204 })
  }),
]
