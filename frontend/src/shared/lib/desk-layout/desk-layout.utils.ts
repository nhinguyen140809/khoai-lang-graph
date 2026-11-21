import { env } from '@/shared/config/env'

import { defaultDeskLayout } from './desk-layout.constants'
import { type ByDeskLayout, type DeskLayout } from './desk-layout.types'

// The one place that decides the arrangement of the desk. For now it is a setting of the
// environment, which a developer sets to look at an arrangement; a way to assign it to users
// replaces the body of this function and nothing else.

/** The arrangement of the desk: the one that `NEXT_PUBLIC_DESK_LAYOUT` names, else the default. */
export function resolveDeskLayout(): DeskLayout {
  return env.NEXT_PUBLIC_DESK_LAYOUT ?? defaultDeskLayout
}

/** The value of the arrangement in use, for the few places where what is drawn differs by arrangement. */
export function byDeskLayout<T>(values: ByDeskLayout<T>): T {
  return values[resolveDeskLayout()]
}
