'use client'

import type { Route } from 'next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

import { noFilters } from '../filter.reducer'
import type { FilterField, FilterValues } from '../filter.types'
import { activeFilterCount, filterSearch, filterValuesOf } from '../filter.utils'

/**
 * The filters applied to a list, kept in the address of the page, so that a link to the page, a
 * reload or Back shows the list filtered the same way: their values, how many have one, and what
 * applies or clears them. Applying replaces the address, so that Back leaves the page instead of
 * going through every change of the filters. A component that calls it needs a Suspense boundary
 * above it, since the address is read in the browser.
 */
export function useFilters(fields: readonly FilterField[]) {
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const values = useMemo(() => filterValuesOf(params, fields), [params, fields])

  const apply = (next: FilterValues) => {
    // The address of the page on screen, which is a page of the app.
    const href = `${pathname}${filterSearch(params, fields, next)}` as Route
    router.replace(href, { scroll: false })
  }

  return {
    values,
    count: activeFilterCount(values),
    apply,
    clear: () => {
      apply(noFilters)
    },
  }
}
