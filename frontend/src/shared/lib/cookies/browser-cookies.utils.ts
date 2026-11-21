/**
 * The name of a cookie of the app. Every name starts with the name of the app, so that it never
 * meets the cookies of another app on the same origin.
 */
export function cookieName(name: string): string {
  return `khoailanggraph-${name}`
}

/** The age of a cookie, in seconds; after it the browser drops the cookie. */
interface CookieAge {
  maxAge: number
}

/**
 * The only module that reads and writes the cookies of the browser (ESLint reports any other
 * use). It is for the state of the app that the next page should find as the user left it, such
 * as the sidebar open or folded. There are no cookies while the server renders, so a read finds
 * none and a write goes nowhere.
 */
export const browserCookies = {
  /** The value of the cookie, with the characters that a cookie cannot hold written safely. */
  get(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined
    const prefix = `${name}=`
    for (const cookie of document.cookie.split('; ')) {
      if (cookie.startsWith(prefix)) return decodeURIComponent(cookie.slice(prefix.length))
    }
    return undefined
  },
  /** Writes the cookie on the whole app, for `maxAge` seconds; a value goes encoded. */
  set(name: string, value: string, { maxAge }: CookieAge): void {
    if (typeof document === 'undefined') return
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${String(maxAge)}`
  },
}
