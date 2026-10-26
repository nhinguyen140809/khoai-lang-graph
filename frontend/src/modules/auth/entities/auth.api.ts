import { apiEndpoints } from '@/shared/api/endpoints'
import { apiCommand } from '@/shared/api/request'

import type { LoginBody, RegisterBody } from './auth.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** Starts a session; the server sets the session cookie. */
export function login(body: LoginBody): Promise<void> {
  return apiCommand(apiEndpoints.login.path(), { action: 'sign in', body })
}

/** Creates an account; it does not start a session. The answer, the new user, is not read. */
export function register(body: RegisterBody): Promise<void> {
  return apiCommand(apiEndpoints.register.path(), { action: 'create the account', body })
}

/** Ends the current session. */
export function logout(): Promise<void> {
  return apiCommand(apiEndpoints.logout.path(), { action: 'sign out' })
}
