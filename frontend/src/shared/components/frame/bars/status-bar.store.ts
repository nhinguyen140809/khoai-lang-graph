import { createRegistryStore } from '@/shared/lib/registry'

import type { StatusBarItem } from './status-bar.types'

/** The items of the status bar. Components register theirs with `useStatusBarItem`. */
export const useStatusBarStore = createRegistryStore<StatusBarItem>()
