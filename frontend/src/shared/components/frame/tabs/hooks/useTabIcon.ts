'use client'

import type { ReactNode } from 'react'

import { tabIconOf } from '../editor-tabs.utils'
import { useTabIconsStore } from '../tab-icons.store'

/** The icon that the icons registered with `useTabIcons` have for a name; nothing for no name. */
export function useTabIcon(name: string | undefined): ReactNode {
  const registered = useTabIconsStore((state) => state.items)
  return name === undefined ? undefined : tabIconOf(registered.values(), name)
}
