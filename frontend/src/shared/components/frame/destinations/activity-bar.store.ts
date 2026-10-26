import { createRegistryStore } from '@/shared/lib/registry'

import type { ActivityBarItem } from './destination.types'

/** The items at the bottom of the activity bar. Components register theirs with `useActivityBarItem`. */
export const useActivityBarStore = createRegistryStore<ActivityBarItem>()
