/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `enabled` serves the API from MSW mocks (src/mocks/) instead of the backend. */
  readonly VITE_API_MOCKING?: 'enabled' | 'disabled'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
