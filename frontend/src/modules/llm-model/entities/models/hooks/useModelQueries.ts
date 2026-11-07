import { useQuery } from '@tanstack/react-query'

import type { HookQueryOptions } from '@/shared/api/query-client'
import { isProduction } from '@/shared/config/env'
import { minuteMs } from '@/shared/lib/time'

import { listModels } from '../models.api'
import { modelKeys } from '../models.keys'

// The catalog is server configuration and changes only with a deploy. A production build reads it
// again after an hour; any other build after ten minutes, so that a changed catalog shows without
// a reload.
const CATALOG_STALE_TIME = isProduction ? 60 * minuteMs : 10 * minuteMs

/** The model catalog. */
export function useModels({ isEnabled = true }: HookQueryOptions = {}) {
  return useQuery({
    queryKey: modelKeys.list(),
    queryFn: listModels,
    enabled: isEnabled,
    staleTime: CATALOG_STALE_TIME,
  })
}
