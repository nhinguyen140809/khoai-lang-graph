'use client'

import { useSearchParams } from 'next/navigation'

import { RouteParam } from '@/shared/routes'

/** The item that the address of a document page names (`?item=`), or null. */
export function useDocumentTarget(): string | null {
  const params = useSearchParams()
  return params.get(RouteParam.Item)
}
