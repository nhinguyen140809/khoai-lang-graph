import { useQuery } from '@tanstack/react-query'

import type { HookQueryOptions } from '@/shared/api/query-client'

import { listModelSettings } from '../model-settings.api'
import { modelSettingKeys } from '../model-settings.keys'

/**
 * The model that the user chose for each agent role. The save of the settings invalidates
 * `modelSettingKeys.all()`.
 */
export function useModelSettings({ isEnabled = true }: HookQueryOptions = {}) {
  return useQuery({
    queryKey: modelSettingKeys.list(),
    queryFn: listModelSettings,
    enabled: isEnabled,
  })
}
