import { type NextRequest, NextResponse } from 'next/server'

import { isTreePath, treePathOf, viewOfHost } from '@/shared/lib/view-tree'

// The pages that every view has, which no folder of a view holds.
const SHARED_PAGES: readonly string[] = ['/login', '/register']

// A path that no page has, so that the app answers it as not found.
const NO_PAGE = '/no-page'

/**
 * Runs before each request for a page and sends it to the pages of the view that its host shows:
 * `/projects` on the developer host is the page `/developer/projects`. The address in the browser
 * does not change. A request that names the folder of a view itself finds no page, so each page
 * has one address.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (SHARED_PAGES.includes(pathname)) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = isTreePath(pathname)
    ? NO_PAGE
    : treePathOf(viewOfHost(request.headers.get('host')), pathname)
  return NextResponse.rewrite(url)
}

export const config = {
  // Every path except the API, the files of Next.js and the files of `public/`, which have a dot.
  matcher: ['/((?!api/|_next/|.*\\..*).*)'],
}
