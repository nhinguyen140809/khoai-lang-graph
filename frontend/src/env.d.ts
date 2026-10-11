declare namespace NodeJS {
  interface ProcessEnv {
    /** `enabled` serves the API from MSW mocks (src/mocks/) instead of the backend. */
    readonly NEXT_PUBLIC_API_MOCKING?: 'enabled' | 'disabled'
    /** Origin that `/api` requests are proxied to. Defaults to http://localhost:8000. */
    readonly API_PROXY_TARGET?: string
    /** Address of a trace viewer; a run with a trace id links to `<address>/<trace id>`. */
    readonly NEXT_PUBLIC_TRACE_URL?: string
  }
}
