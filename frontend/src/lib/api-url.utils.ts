/** Absolute URL for an API path, so the same code works in the browser and in Node-based tests. */
export function apiUrl(path: string): string {
  return new URL(path, window.location.origin).toString()
}
