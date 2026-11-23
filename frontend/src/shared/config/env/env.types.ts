import { z } from 'zod'

import { deskLayouts } from '@/shared/lib/layout/layout.types'

// The variables that the browser bundle and the server read, checked once when the app starts so
// that a wrong value fails with a clear message instead of a surprise later. Add a variable here,
// then to `env.config.ts`, then to `.env.example`. Variables that only the tools at the root of
// the project read (`next.config.ts`, Playwright) stay with those tools.
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  /** `enabled` serves the API from the mocks, so the UI runs without the backend. */
  NEXT_PUBLIC_API_MOCKING: z.enum(['enabled', 'disabled']).optional(),
  /** The arrangement of the desk of the user view, for a developer who looks at one; the default when unset. */
  NEXT_PUBLIC_DESK_LAYOUT: z.enum(deskLayouts).optional(),
})
