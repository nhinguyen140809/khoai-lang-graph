'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { routeOfAddress } from '@/shared/routes'

import { sectionOf } from '../design-system.utils'

/**
 * The open tab, kept in the `section` query of the address, so that a reload or a shared link
 * shows the same tab. Choosing a tab replaces the address, so that Back leaves the page. A
 * component that calls it needs a Suspense boundary above it, since the address is read in the
 * browser.
 */
export function useActiveSection<Id extends string>(
  ids: readonly Id[],
  fallback: Id,
): [Id, (id: string) => void] {
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const active = sectionOf(params.get('section'), ids, fallback)

  const select = (id: string) => {
    // The address of the page on screen, which is a page of the app.
    router.replace(routeOfAddress(`${pathname}?section=${sectionOf(id, ids, fallback)}`), {
      scroll: false,
    })
  }

  return [active, select]
}
