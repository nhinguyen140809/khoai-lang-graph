import { z } from 'zod'

// The variables that the browser bundle and the server read, checked once when the app starts so
// that a wrong value fails with a clear message instead of a surprise later. Add a variable here,
// then to `env.config.ts`, then to `.env.example`. Variables that only the tools at the root of
// the project read (`next.config.ts`, Playwright) stay with those tools.
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  /** `enabled` serves the API from the mocks, so the UI runs without the backend. */
  NEXT_PUBLIC_API_MOCKING: z.enum(['enabled', 'disabled']).optional(),
})
