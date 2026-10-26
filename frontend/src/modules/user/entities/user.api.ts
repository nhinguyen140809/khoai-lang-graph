import { apiEndpoints } from '@/shared/api/endpoints'
import { apiRequest } from '@/shared/api/request'

import { type Me, meSchema } from './user.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** The signed-in user. */
export function getMe(): Promise<Me> {
  return apiRequest(apiEndpoints.me.path(), meSchema, { action: 'load your account' })
}
