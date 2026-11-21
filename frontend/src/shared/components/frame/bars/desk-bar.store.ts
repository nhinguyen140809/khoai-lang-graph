import { createRegistryStore } from '@/shared/lib/registry'

import type { DeskBarItem } from './desk-bar.types'

/** The items of the bar of the desk. Pages register theirs with `useDeskBarItem` or `DeskBarItem`. */
export const useDeskBarStore = createRegistryStore<DeskBarItem>()
