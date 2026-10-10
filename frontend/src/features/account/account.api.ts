import { apiCommand, apiRequest } from '@/lib/api-fetch.utils'

import { type LoginBody, type Me, meSchema, type RegisterBody } from './account.types'

// TODO: switch to the generated client in src/api/generated/ once it is generated.

/** The signed-in user. */
export function getMe(): Promise<Me> {
  return apiRequest('/api/v1/me', meSchema, { action: 'load your account' })
}

/** Starts a session; the server sets the session cookie. */
export function login(body: LoginBody): Promise<void> {
  return apiCommand('/api/v1/auth/login', { action: 'sign in', body })
}

/** Creates an account; it does not start a session. */
export function register(body: RegisterBody): Promise<Me> {
  return apiRequest('/api/v1/auth/register', meSchema, {
    action: 'create the account',
    method: 'POST',
    body,
  })
}

/** Ends the current session. */
export function logout(): Promise<void> {
  return apiCommand('/api/v1/auth/logout', { action: 'sign out' })
}
