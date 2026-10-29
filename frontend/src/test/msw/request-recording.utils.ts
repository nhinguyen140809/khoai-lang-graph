import { server } from '@/mocks/msw-server.setup'

interface RecordedRequest {
  method: string
  /** The path with its query string. */
  path: string
  /** The JSON body, null without one; undefined until it is read. */
  body: unknown
  /** The values of the headers asked for; null for a header that was not sent. */
  headers?: Record<string, string | null>
}

/**
 * Records the method, path with its query, and JSON body of every request until the test ends, and
 * the values of the headers named in `headerNames`, in the order the requests were sent: each one
 * takes its place when it starts, and gets its body once it is read. The setup of Vitest removes
 * the listener.
 */
export function recordRequests(headerNames: string[] = []) {
  const requests: RecordedRequest[] = []
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url)
    const recorded: RecordedRequest = {
      method: request.method,
      path: `${url.pathname}${url.search}`,
      body: undefined,
      ...(headerNames.length > 0 && {
        headers: Object.fromEntries(headerNames.map((name) => [name, request.headers.get(name)])),
      }),
    }
    requests.push(recorded)
    void request
      .clone()
      .text()
      .then((text) => {
        recorded.body = text === '' ? null : (JSON.parse(text) as unknown)
      })
  })
  return requests
}
