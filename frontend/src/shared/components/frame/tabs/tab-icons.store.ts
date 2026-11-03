import { createRegistryStore } from '@/shared/lib/registry'

import type { TabIcons } from '../destinations/destination.types'

/** The icons of the editor tabs. Components register theirs with `useTabIcons`. */
export const useTabIconsStore = createRegistryStore<TabIcons>()
