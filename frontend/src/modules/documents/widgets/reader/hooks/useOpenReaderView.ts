'use client'

import { usePathname, useRouter } from 'next/navigation'

import { routeOfAddress } from '@/shared/routes'

import type { ReaderView } from '../reader.types'
import { readerAddress } from '../reader.utils'

/**
 * Opens the reader of the page on a view, by naming it in the query of the page. It adds a step to
 * the history, so that Back closes the reader; `hrefOf` gives the address for a link, and `back` returns to the view before.
 */
export function useOpenReaderView() {
  const router = useRouter()
  const pathname = usePathname()
  const hrefOf = (view: ReaderView) => routeOfAddress(readerAddress(pathname, view))

  return {
    hrefOf,
    open: (view: ReaderView) => {
      router.push(hrefOf(view), { scroll: false })
    },
    back: () => {
      router.back()
    },
    close: () => {
      router.replace(routeOfAddress(pathname), { scroll: false })
    },
  }
}
