import type { UpdateMeBody } from '@/modules/user/entities'

import { mockNow } from '../shared/db'
import { currentPassword, currentUser } from './account.store'
import { removeOtherSessions } from './sessions.changes'

/** Changes the fields given of the user, the name trimmed. */
export function changeMe(fields: UpdateMeBody) {
  const { display_name: displayName, ...others } = fields
  currentUser.set({
    ...currentUser.get(),
    ...others,
    ...(displayName !== undefined && { display_name: displayName.trim() }),
    updated_at: mockNow(),
  })
}

/** Changes the password of the user; every session but the one of this browser ends. */
export function changeStoredPassword(password: string) {
  currentPassword.set(password)
  removeOtherSessions()
}
