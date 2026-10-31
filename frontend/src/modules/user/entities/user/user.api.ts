import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { apiCommand, apiRequest } from '@/shared/api/request'

import { type ChangePasswordBody, type Me, meSchema, type UpdateMeBody } from './user.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** The signed-in user. */
export function getMe(): Promise<Me> {
  return apiRequest(apiEndpoints.me.path(), meSchema, { action: 'load your account' })
}

/** Changes the name or the picture of the user, and gives the user as saved. */
export function updateMe(body: UpdateMeBody): Promise<Me> {
  return apiRequest(apiEndpoints.me.path(), meSchema, {
    action: 'save your profile',
    method: HttpMethod.Patch,
    body,
  })
}

/**
 * Changes the password; the session of this browser stays and the other sessions of the user end.
 */
export function changePassword(body: ChangePasswordBody): Promise<void> {
  return apiCommand(apiEndpoints.password.path(), { action: 'change your password', body })
}
