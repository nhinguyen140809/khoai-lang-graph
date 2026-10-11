import { useQuery } from '@tanstack/react-query'

import { getCurrentDefinition } from '../project-settings.api'

export function useSettingsDefinition() {
  return useQuery({
    queryKey: ['project-settings', 'definition'],
    queryFn: getCurrentDefinition,
    staleTime: 5 * 60_000,
  })
}
