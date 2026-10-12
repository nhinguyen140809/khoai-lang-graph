import { useEffect } from 'react'

import { useFrameStore } from '../../frame.store'
import { useFrameHydrated } from '../../hooks/useFrameHydrated'

/**
 * Keeps the side panel of the first page opened. Until a feature is chosen on the activity bar,
 * the side panel follows the page on screen; once the stored state has been read, `id` is stored
 * as the chosen feature, so its side panel stays until another is chosen.
 *
 * @param id The feature whose side panel is shown, undefined when the screen has none.
 */
export function usePinSideFeature(id: string | undefined) {
  const hydrated = useFrameHydrated()
  const chosen = useFrameStore((state) => state.sideFeature !== null)
  const setSideFeature = useFrameStore((state) => state.setSideFeature)

  useEffect(() => {
    if (hydrated && !chosen && id !== undefined) setSideFeature(id)
  }, [hydrated, chosen, id, setSideFeature])
}
