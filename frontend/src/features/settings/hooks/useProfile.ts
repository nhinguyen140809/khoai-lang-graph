import { useQuery } from '@tanstack/react-query'

import { apiRequest } from '@/lib/api-fetch.utils'

import { profileSchema } from '../settings.types'

/** The signed-in user, for the form of the profile. */
export function useProfile() {
  return useQuery({
    queryKey: ['settings', 'profile'],
    queryFn: () => apiRequest('/api/v1/me', profileSchema, { action: 'load your account' }),
  })
}
