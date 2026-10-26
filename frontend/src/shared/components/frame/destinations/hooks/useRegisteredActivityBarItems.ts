import { useRegisteredItems } from '@/shared/lib/registry'

import { useActivityBarStore } from '../activity-bar.store'

/** The items registered with `useActivityBarItem`, in their order. */
export function useRegisteredActivityBarItems() {
  return useRegisteredItems(useActivityBarStore)
}
