/**
 * Opens `href` with a full page load, which drops what the app kept in memory, such as the query
 * cache, so that nothing of the previous session shows on the next page.
 */
export function reloadTo(href: string) {
  window.location.assign(href)
}
