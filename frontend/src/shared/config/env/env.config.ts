import { envSchema } from './env.types'

// Next.js inlines `process.env.NEXT_PUBLIC_*` into the browser bundle only where the name is
// written out in full, so each variable is read by name here instead of passing `process.env`.
export const env = envSchema.parse({
  // eslint-disable-next-line no-restricted-properties -- the one place that reads process.env
  NODE_ENV: process.env.NODE_ENV,
  // eslint-disable-next-line no-restricted-properties -- the one place that reads process.env
  NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
  // eslint-disable-next-line no-restricted-properties -- the one place that reads process.env
  NEXT_PUBLIC_DESK_LAYOUT: process.env.NEXT_PUBLIC_DESK_LAYOUT,
  // eslint-disable-next-line no-restricted-properties -- the one place that reads process.env
  NEXT_PUBLIC_ANIMATION_LIVE_LINK: process.env.NEXT_PUBLIC_ANIMATION_LIVE_LINK,
})

export const isProduction = env.NODE_ENV === 'production'
export const isMockingEnabled = env.NEXT_PUBLIC_API_MOCKING === 'enabled'

/** The address of the live link of the tool that builds the animation files, when a developer has set one; never in production. */
export const animationLiveLink = isProduction ? undefined : env.NEXT_PUBLIC_ANIMATION_LIVE_LINK
