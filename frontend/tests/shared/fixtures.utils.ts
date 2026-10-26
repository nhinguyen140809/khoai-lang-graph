import { test as base } from '@playwright/test'

import { userOf, type UserSteps } from './steps'

/**
 * The `test` of the E2E specs. It adds `user` to the fixtures of Playwright: the steps of
 * `tests/shared/steps`, bound to the page of the test.
 */
export const test = base.extend<{ user: UserSteps }>({
  // The second argument gives the fixture to the test; it is named `provide` since a call named
  // `use` reads as a React hook.
  user: async ({ page }, provide) => {
    await provide(userOf(page))
  },
})
