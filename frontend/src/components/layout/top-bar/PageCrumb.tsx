'use client'

import { usePathname } from 'next/navigation'

/** The name of a screen outside a project, for the top bar. */
export function PageCrumb() {
  return usePathname().startsWith('/settings') ? 'Settings' : 'Projects'
}
