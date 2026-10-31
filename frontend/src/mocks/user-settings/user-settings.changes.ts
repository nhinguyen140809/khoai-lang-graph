import type { ReplaceUserSettingsBody } from '@/modules/user/entities'

import { currentUser } from '../account/account.store'
import { mockNow } from '../shared/db'
import { defaultUserSettings } from './user-settings.fixtures'
import { currentUserSettings } from './user-settings.lookup'
import { savedUserSettings } from './user-settings.store'

/** Changes the fields given and keeps the others; `updated_at` changes only when a value does. */
export function changeUserSettings(fields: ReplaceUserSettingsBody) {
  const before = currentUserSettings()
  const after = { ...before, ...fields }
  const isChanged = JSON.stringify(after) !== JSON.stringify(before)
  savedUserSettings.set(isChanged ? { ...after, updated_at: mockNow() } : before)
}

/** Writes the defaults for the signed-in user, as a new account starts from them. */
export function resetUserSettings() {
  savedUserSettings.set(defaultUserSettings(currentUser.get()))
}
