import { useQuery } from '@tanstack/react-query'

import type { HookQueryOptions } from '@/shared/api/query-client'

import { getUserSettings } from '../user-settings.api'
import { userSettingsKeys } from '../user-settings.keys'

/** The settings of the user. Saving them invalidates `userSettingsKeys.all()`. */
export function useUserSettings({ isEnabled = true }: HookQueryOptions = {}) {
  return useQuery({
    queryKey: userSettingsKeys.detail(),
    queryFn: getUserSettings,
    enabled: isEnabled,
  })
}
