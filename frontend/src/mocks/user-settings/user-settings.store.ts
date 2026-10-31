import type { UserSettings } from '@/modules/user/entities'

import { mockState } from '../shared/db'

// The settings that PUT /me/settings or a register wrote; null until the first one.
export const savedUserSettings = mockState<UserSettings | null>('user-settings', () => null)
