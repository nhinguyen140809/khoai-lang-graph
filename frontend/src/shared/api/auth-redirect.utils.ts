// Where the app goes when a request answers 401: every endpoint except register, login and health
// requires a session.

/** The pages that need no session. */
export const authPaths: readonly string[] = ['/login', '/register']

/** The page to return to after signing in, when none is given. */
export const DEFAULT_AFTER_SIGN_IN = '/projects'

// Any origin works here: only a `next` that stays on it is kept.
const BASE = 'http://app.invalid'

/**
 * The page to return to after signing in: a path of this app only, never another origin, so that
 * a link cannot send the user elsewhere after they sign in. The check runs on the parsed address,
 * because the URL parser drops tabs and line breaks and reads a backslash as a slash.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next?.startsWith('/')) return DEFAULT_AFTER_SIGN_IN
  let url: URL
  try {
    url = new URL(next, BASE)
  } catch {
    return DEFAULT_AFTER_SIGN_IN
  }
  if (url.origin !== BASE) return DEFAULT_AFTER_SIGN_IN
  const page = url.pathname.replace(/(.)\/+$/, '$1')
  return authPaths.includes(page)
    ? DEFAULT_AFTER_SIGN_IN
    : `${url.pathname}${url.search}${url.hash}`
}

/** The address of a sign-in or account page that returns to `next` afterwards. */
export function authHref(page: '/login' | '/register', next: string | null | undefined): string {
  const target = safeNextPath(next)
  return target === DEFAULT_AFTER_SIGN_IN ? page : `${page}?next=${encodeURIComponent(target)}`
}

/** Leaves the page for the sign-in page, which returns here afterwards. */
export function redirectToSignIn() {
  const { pathname, search, hash } = window.location
  if (authPaths.includes(pathname)) return
  openPage(authHref('/login', `${pathname}${search}${hash}`))
}

/**
 * Opens `href` with a full page load, which drops what the app kept in memory, such as the query
 * cache, so that nothing of the previous session shows on the next page.
 */
export function openPage(href: string) {
  window.location.assign(href)
}
