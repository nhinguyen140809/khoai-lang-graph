import type { View } from '@/shared/lib/view'
import { routes, userRoutes } from '@/shared/routes'

/** The page of the settings in each view: the settings are the same, the pages are not. */
export const settingsPages = {
  user: userRoutes.settings,
  developer: routes.settings,
} as const satisfies Record<View, () => string>

/** The name of each view of the app, as the page that asks and the account menu call it. */
export const viewLabels = {
  user: 'Guided view',
  developer: 'Developer view',
} as const satisfies Record<View, string>
