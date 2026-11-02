'use client'

import { useRegisterItem } from '@/shared/lib/registry'

import type { TabIcons } from '../../destinations/destination.types'
import { useTabIconsStore } from '../tab-icons.store'

/**
 * Registers the icons that the pages of a feature name for their tabs while the calling component is
 * mounted, as `useCommands` does for commands: a tab keeps its icon when its page leaves the screen,
 * so the component that registers them is one that stays, such as a contribution of the frame. The
 * icons take effect each time they change: pass a constant, or keep them in `useMemo`.
 */
export function useTabIcons(icons: TabIcons) {
  useRegisterItem(useTabIconsStore, icons)
}
