import { useQuery } from '@tanstack/react-query'

import { getUserSettings } from '../settings.api'

export const userSettingsQueryKey = ['settings', 'user-settings'] as const

export function useUserSettings() {
  return useQuery({ queryKey: userSettingsQueryKey, queryFn: getUserSettings })
}
