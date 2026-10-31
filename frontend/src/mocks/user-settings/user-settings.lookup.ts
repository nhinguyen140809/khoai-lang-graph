import type { UserSettings } from '@/modules/user/entities'

import { userSettingsFixture } from './user-settings.fixtures'
import { savedUserSettings } from './user-settings.store'

/**
 * The settings of the user as the mock server holds them now: the fixture, until a write replaces
 * it.
 */
export function currentUserSettings(): UserSettings {
  return savedUserSettings.get() ?? userSettingsFixture
}
