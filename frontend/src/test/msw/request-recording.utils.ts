import { server } from '@/mocks/msw-server.setup'

interface RecordedRequest {
  method: string
  /** The path with its query string. */
  path: string
  body: unknown
  /** The values of the headers asked for; null for a header that was not sent. */
  headers?: Record<string, string | null>
}

/**
 * Records the method, path with its query, and JSON body of every request until the test ends, and
 * the values of the headers named in `headerNames`. The setup of Vitest removes the listener.
 */
export function recordRequests(headerNames: string[] = []) {
  const requests: RecordedRequest[] = []
  server.events.on('request:start', ({ request }) => {
    const copy = request.clone()
    void copy.text().then((text) => {
      const url = new URL(request.url)
      requests.push({
        method: request.method,
        path: `${url.pathname}${url.search}`,
        body: text === '' ? null : (JSON.parse(text) as unknown),
        ...(headerNames.length > 0 && {
          headers: Object.fromEntries(headerNames.map((name) => [name, request.headers.get(name)])),
        }),
      })
    })
  })
  return requests
}

/** Stops recording the requests; call it after each test that records them. */
export function stopRecordingRequests() {
  server.events.removeAllListeners()
}
