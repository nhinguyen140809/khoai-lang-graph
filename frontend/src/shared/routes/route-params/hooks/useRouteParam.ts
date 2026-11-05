'use client'

import { useSearchParams } from 'next/navigation'

import type { RouteParamName } from '../route-params.types'

/** The value of one query parameter of the page, such as the item that a document page scrolls to; null without it. */
export function useRouteParam(name: RouteParamName): string | null {
  return useSearchParams().get(name)
}
