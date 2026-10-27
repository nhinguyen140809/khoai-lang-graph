import { reloadTo } from '@/shared/lib/url'

import { loginHrefFor } from './auth-hrefs.utils'

// Where the app goes when a request answers 401: every endpoint except register, login and health
// requires a session.

/** Leaves the page for the login page, which returns here afterwards. */
export function redirectToLogin() {
  const href = loginHrefFor(window.location)
  if (href !== null) reloadTo(href)
}
