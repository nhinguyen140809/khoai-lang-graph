import type { Route } from 'next'

// Where the app goes when a request answers 401: every endpoint except register, login and health
// requires a session.

/** The pages that need no session. */
export const AuthPage = {
  Login: '/login',
  Register: '/register',
} as const

export type AuthPage = (typeof AuthPage)[keyof typeof AuthPage]

const authPages: readonly string[] = Object.values(AuthPage)

/** The query parameter of those pages that names the page to return to after signing in. */
export const NEXT_PARAM = 'next'

/** The page to return to after signing in, when none is given. */
export const DEFAULT_AFTER_SIGN_IN: Route = '/projects'

// Any origin works here: only a `next` that stays on it is kept.
const BASE = 'http://app.invalid'

/**
 * The page to return to after signing in: a path of this app only, never another origin, so that
 * a link cannot send the user elsewhere after they sign in. The check runs on the parsed address,
 * because the URL parser drops tabs and line breaks and reads a backslash as a slash.
 */
export function safeNextPath(next: string | null | undefined): Route {
  if (!next?.startsWith('/')) return DEFAULT_AFTER_SIGN_IN
  let url: URL
  try {
    url = new URL(next, BASE)
  } catch {
    return DEFAULT_AFTER_SIGN_IN
  }
  if (url.origin !== BASE) return DEFAULT_AFTER_SIGN_IN
  const page = url.pathname.replace(/(.)\/+$/, '$1')
  if (authPages.includes(page)) return DEFAULT_AFTER_SIGN_IN
  // A path of this app that came from an address, so the route types cannot check it.
  return `${url.pathname}${url.search}${url.hash}` as Route
}

/** The address of a sign-in or account page that returns to `next` afterwards. */
export function authHref(page: AuthPage, next: string | null | undefined): Route {
  const target = safeNextPath(next)
  if (target === DEFAULT_AFTER_SIGN_IN) return page
  const query = new URLSearchParams({ [NEXT_PARAM]: target })
  return `${page}?${query.toString()}` as Route
}

/** The page to return to, read from the query of a sign-in or account page. */
export function nextParam(query: Record<string, string | string[] | undefined>): string | null {
  const value = query[NEXT_PARAM]
  return typeof value === 'string' ? value : null
}

/** Leaves the page for the sign-in page, which returns here afterwards. */
export function redirectToSignIn() {
  const { pathname, search, hash } = window.location
  if (authPages.includes(pathname)) return
  loadPage(authHref(AuthPage.Login, `${pathname}${search}${hash}`))
}

/**
 * Opens `href` with a full page load, which drops what the app kept in memory, such as the query
 * cache, so that nothing of the previous session shows on the next page.
 */
export function loadPage(href: string) {
  window.location.assign(href)
}
