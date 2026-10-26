import { server } from '@/mocks/msw-server.setup'

/** Records the method, path and JSON body of every request until the test ends. */
export function recordRequests() {
  const requests: { method: string; path: string; body: unknown }[] = []
  server.events.on('request:start', ({ request }) => {
    const copy = request.clone()
    void copy.text().then((text) => {
      requests.push({
        method: request.method,
        path: new URL(request.url).pathname,
        body: text === '' ? null : (JSON.parse(text) as unknown),
      })
    })
  })
  return requests
}

/** Stops recording the requests; call it after each test that records them. */
export function stopRecordingRequests() {
  server.events.removeAllListeners()
}
