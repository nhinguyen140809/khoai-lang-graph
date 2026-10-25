import { http, HttpResponse } from 'msw'

import type { Me } from '@/modules/user/entities'

import { mockRecord } from '../shared/db/mock-db.utils'
import { readBodyFields } from '../shared/http/request/request-body.utils'
import { unauthenticated, validationFailed } from '../shared/http/response/problem.utils'
import { mockScenario, neverAnswer } from '../shared/scenario/mock-scenario.utils'
import { meRecord } from './me.handlers'

// The session of the mock server: signed in until the user signs out.
const sessionRecord = mockRecord('session', () => ({ signedIn: true }))

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
        pathname.startsWith('/api/v1/') &&
        !PUBLIC_PATHS.includes(pathname) &&
        !sessionRecord.get().signedIn
      )
    },
    () => unauthenticated('Sign in to continue.'),
  ),

  http.post('/api/v1/auth/login', async ({ request }) => {
    const scenario = mockScenario('login')
    if (scenario === 'loading') return neverAnswer()
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

  http.post('/api/v1/auth/register', async ({ request }) => {
    const scenario = mockScenario('register')
    if (scenario === 'loading') return neverAnswer()
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
    return HttpResponse.json(me, { status: 201, headers: { Location: '/api/v1/me' } })
  }),

  http.post('/api/v1/auth/logout', () => {
    sessionRecord.set({ signedIn: false })
    return new HttpResponse(null, { status: 204 })
  }),
]
