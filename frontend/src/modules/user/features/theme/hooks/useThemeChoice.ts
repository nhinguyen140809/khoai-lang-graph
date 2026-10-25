import { useTheme } from 'next-themes'

import { useIsHydrated } from '@/shared/lib/hydration/hooks/useIsHydrated'

/**
 * The theme chosen, and the function that chooses one. The theme is stored in this browser, so it
 * is known only after hydration; until then no theme is chosen.
 */
export function useThemeChoice() {
  const { theme, setTheme } = useTheme()
  const hydrated = useIsHydrated()
  return { chosen: hydrated ? theme : undefined, choose: setTheme }
}
