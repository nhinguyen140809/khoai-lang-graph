'use client'

import { usePathname } from 'next/navigation'

import { isAtOrUnder } from '@/shared/lib/url/path.utils'

interface PageCrumbProps {
  /** The name of each page, by the start of its address; the first that matches is shown. */
  pages: readonly { path: string; name: string }[]
  /** The name shown when no page matches. */
  fallback: string
}

/** The name of the page on screen, after "khoai /" on the top bar. */
export function PageCrumb({ pages, fallback }: PageCrumbProps) {
  const pathname = usePathname()
  const page = pages.find(({ path }) => isAtOrUnder(pathname, path))
  return page?.name ?? fallback
}
