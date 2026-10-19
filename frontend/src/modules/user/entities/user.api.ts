import { apiRequest } from '@/shared/api/api-fetch.utils'

import { type Me, meSchema } from './user.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** The signed-in user. */
export function getMe(): Promise<Me> {
  return apiRequest('/api/v1/me', meSchema, { action: 'load your account' })
}
