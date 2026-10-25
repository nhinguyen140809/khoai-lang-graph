/**
 * The query parameters of the pages. The functions of the routes write them and the pages read
 * them, so that both use the same names.
 */
export const RouteParam = {
  /** The page to return to after signing in, on the sign-in and account pages. */
  Next: 'next',
} as const
