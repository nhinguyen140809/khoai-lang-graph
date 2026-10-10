import { http, HttpResponse } from 'msw'

import type { Me } from '@/features/account'

import { meRecord } from './me.handlers'
import { mockRecord } from './mock-db.utils'
import { mockScenario } from './mock-scenario.utils'
import { problem } from './problem.utils'

// The session of the mock server: signed in until the user signs out.
const sessionRecord = mockRecord('session', () => ({ signedIn: true }))

// Endpoints that answer without a session.
const PUBLIC_PATHS = ['/api/v1/auth/register', '/api/v1/auth/login', '/api/v1/auth/logout']

interface Credentials {
  email?: unknown
  password?: unknown
  display_name?: unknown
}

async function readCredentials(request: Request): Promise<Credentials> {
  const body: unknown = await request.json().catch(() => null)
  return typeof body === 'object' && body !== null ? body : {}
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function missingFields(credentials: Credentials, fields: (keyof Credentials)[]) {
  return fields
    .filter((field) => text(credentials[field]) === '')
    .map((field) => ({ field, message: 'Enter a value.' }))
}

export const authHandlers = [
  // Every other endpoint answers 401 without a session, as the API does. Returning nothing passes
  // the request on to the handler of its endpoint.
  http.all('/api/v1/*', ({ request }) => {
    const { pathname } = new URL(request.url)
    if (PUBLIC_PATHS.includes(pathname) || sessionRecord.get().signedIn) return undefined
    return problem(401, 'unauthenticated', 'Unauthenticated', 'Sign in to continue.')
  }),

  http.post('/api/v1/auth/login', async ({ request }) => {
    const credentials = await readCredentials(request)
    const missing = missingFields(credentials, ['email', 'password'])
    if (missing.length > 0) {
      return problem(422, 'validation_failed', 'Validation failed', null, missing)
    }
    // The same answer for an unknown email and a wrong password.
    if (mockScenario('login') === 'error') {
      return problem(
        401,
        'unauthenticated',
        'Unauthenticated',
        'The email or the password is wrong.',
      )
    }
    sessionRecord.set({ signedIn: true })
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/v1/auth/register', async ({ request }) => {
    const credentials = await readCredentials(request)
    const missing = missingFields(credentials, ['email', 'password', 'display_name'])
    if (missing.length > 0) {
      return problem(422, 'validation_failed', 'Validation failed', null, missing)
    }
    if (mockScenario('register') === 'error') {
      return problem(422, 'validation_failed', 'Validation failed', null, [
        { field: 'email', message: 'An account with this email exists.' },
      ])
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
