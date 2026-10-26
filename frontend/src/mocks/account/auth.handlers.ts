import { http } from 'msw'

import type { Me } from '@/modules/user/entities'
import { apiBasePath, apiEndpoints, publicApiPaths } from '@/shared/api/endpoints'

import { mockNow } from '../shared/db/mock-clock.utils'
import { readBodyFields } from '../shared/http/request/request-body.utils'
import { unauthenticated, validationFailed } from '../shared/http/response/error-response.utils'
import { created, noContent } from '../shared/http/response/status-response.utils'
import { requiredText, requiredTextProblem } from '../shared/http/validation/field-values.utils'
import { mockScenario, pendingForever } from '../shared/scenario/mock-scenario.utils'
import { currentUser, sessionState } from './account.store'


function missingFields(credentials: Record<string, unknown>, fields: string[]) {
  return fields
    .filter((field) => requiredText(credentials[field]) === undefined)
    .map(requiredTextProblem)
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
        !sessionState.get().loggedIn
      )
    },
    () => unauthenticated('Log in to continue.'),
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
    sessionState.set({ loggedIn: true })
    return noContent()
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
    const now = mockNow()
    const me: Me = {
      ...currentUser.get(),
      email: (requiredText(credentials.email) ?? '').toLowerCase(),
      display_name: requiredText(credentials.display_name) ?? '',
      created_at: now,
      updated_at: now,
    }
    currentUser.set(me)
    return created(me, apiEndpoints.me.path())
  }),

  http.post(apiEndpoints.logout.pattern, () => {
    sessionState.set({ loggedIn: false })
    return noContent()
  }),
]
