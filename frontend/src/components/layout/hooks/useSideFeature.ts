import { usePathname } from 'next/navigation'

import { featureOfPathname, type ProjectFeature } from '../activity-bar.config'
import { useFrameStore } from '../frame.store'

/**
 * The feature whose side panel is shown. It is the one the user chose on the activity bar; until
 * one is chosen, it is the feature of the page on screen.
 */
export function useSideFeature(): ProjectFeature {
  const pathname = usePathname()
  const chosen = useFrameStore((state) => state.sideFeature)
  return chosen ?? featureOfPathname(pathname) ?? 'console'
}
