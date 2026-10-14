import { signInHrefFor } from '@/shared/config/routes'

// Where the app goes when a request answers 401: every endpoint except register, login and health
// requires a session.

/** Leaves the page for the sign-in page, which returns here afterwards. */
export function redirectToSignIn() {
  const href = signInHrefFor(window.location)
  if (href !== null) loadPage(href)
}

/**
 * Opens `href` with a full page load, which drops what the app kept in memory, such as the query
 * cache, so that nothing of the previous session shows on the next page.
 */
export function loadPage(href: string) {
  window.location.assign(href)
}
