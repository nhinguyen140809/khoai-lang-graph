import type { Route } from 'next'

import { queryString } from '@/shared/lib/url'

import { RouteParam } from '../route-params'
import { routeOfAddress } from '../typed-route'

// The pages that need no session, and the page to return to that every other page can be. A link
// may carry any `next`, so it is checked before the app opens it.

const AuthPage = {
  Login: '/login',
  Register: '/register',
} as const

const authPages: readonly string[] = Object.values(AuthPage)

/** The page to return to after logging in, when none is given. */
export const defaultAfterLogin: Route = '/'

// Any origin works here: only a `next` that stays on it is kept.
const BASE = 'http://app.invalid'

/**
 * The page to return to after logging in: a path of this app only, never another origin, so that
 * a link cannot send the user elsewhere after they log in. The check runs on the parsed address,
 * because the URL parser drops tabs and line breaks and reads a backslash as a slash.
 */
export function afterLoginPath(next: string | null | undefined): Route {
  if (!next?.startsWith('/')) return defaultAfterLogin
  let url: URL
  try {
    url = new URL(next, BASE)
  } catch {
    return defaultAfterLogin
  }
  if (url.origin !== BASE) return defaultAfterLogin
  const page = url.pathname.replace(/(.)\/+$/, '$1')
  if (authPages.includes(page)) return defaultAfterLogin
  return routeOfAddress(`${url.pathname}${url.search}${url.hash}`)
}

// A page of the account that returns to `next` afterwards; the default page needs no `next`.
function authHref(page: (typeof AuthPage)[keyof typeof AuthPage], next: string | null | undefined) {
  const target = afterLoginPath(next)
  const query = queryString({
    [RouteParam.Next]: target === defaultAfterLogin ? undefined : target,
  })
  return routeOfAddress(`${page}${query}`)
}

/** The login page, which returns to `next` afterwards. */
export function loginHref(next?: string | null): Route {
  return authHref(AuthPage.Login, next)
}

/** The page that creates an account, which returns to `next` afterwards. */
export function registerHref(next?: string | null): Route {
  return authHref(AuthPage.Register, next)
}

/** The login page that returns to `location` afterwards; null on a login or account page. */
export function loginHrefFor({
  pathname,
  search: query,
  hash,
}: Pick<Location, 'pathname' | 'search' | 'hash'>): Route | null {
  if (authPages.includes(pathname)) return null
  return loginHref(`${pathname}${query}${hash}`)
}

// Kept until the callers use the new name.
export { nextParam } from '../route-params/route-params.utils'
