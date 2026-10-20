import type { Route } from 'next'

import { search } from './route-builder.utils'
import { RouteParam } from './route-params.constants'

// The pages that need no session, and the page to return to that every other page can be. A link
// may carry any `next`, so it is checked before the app opens it.

const AuthPage = {
  Login: '/login',
  Register: '/register',
} as const

const authPages: readonly string[] = Object.values(AuthPage)

/** The page to return to after signing in, when none is given. */
export const defaultAfterSignIn: Route = '/'

// Any origin works here: only a `next` that stays on it is kept.
const BASE = 'http://app.invalid'

/**
 * The page to return to after signing in: a path of this app only, never another origin, so that
 * a link cannot send the user elsewhere after they sign in. The check runs on the parsed address,
 * because the URL parser drops tabs and line breaks and reads a backslash as a slash.
 */
export function safeNextPath(next: string | null | undefined): Route {
  if (!next?.startsWith('/')) return defaultAfterSignIn
  let url: URL
  try {
    url = new URL(next, BASE)
  } catch {
    return defaultAfterSignIn
  }
  if (url.origin !== BASE) return defaultAfterSignIn
  const page = url.pathname.replace(/(.)\/+$/, '$1')
  if (authPages.includes(page)) return defaultAfterSignIn
  // A path of this app that came from an address, so the route types cannot check it.
  return `${url.pathname}${url.search}${url.hash}` as Route
}

// A page of the account that returns to `next` afterwards; the default page needs no `next`.
function authHref(page: (typeof AuthPage)[keyof typeof AuthPage], next: string | null | undefined) {
  const target = safeNextPath(next)
  const query = search({ [RouteParam.Next]: target === defaultAfterSignIn ? undefined : target })
  return `${page}${query}` as Route
}

/** The sign-in page, which returns to `next` afterwards. */
export function signInHref(next?: string | null): Route {
  return authHref(AuthPage.Login, next)
}

/** The page that creates an account, which returns to `next` afterwards. */
export function registerHref(next?: string | null): Route {
  return authHref(AuthPage.Register, next)
}

/** The sign-in page that returns to `location` afterwards; null on a sign-in or account page. */
export function signInHrefFor({
  pathname,
  search: query,
  hash,
}: Pick<Location, 'pathname' | 'search' | 'hash'>): Route | null {
  if (authPages.includes(pathname)) return null
  return signInHref(`${pathname}${query}${hash}`)
}

/** The page to return to, read from the query of a sign-in or account page. */
export function nextParam(query: Record<string, string | string[] | undefined>): string | null {
  const value = query[RouteParam.Next]
  return typeof value === 'string' ? value : null
}
