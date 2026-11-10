import { test as base } from '@playwright/test'

import { type ApiClient, apiClientOf, apiOf, type ApiSteps } from './api'
import { frontendUrl } from './backend-env.constants'
import { userOf, type UserSteps } from './steps'

/**
 * The `test` of the E2E specs. It adds to the fixtures of Playwright `user`, the steps of
 * `tests/shared/steps` bound to the page of the test, and, for the specs that run against the
 * backend, `client` (the API, signed in as the page is) and `api` (the steps on runs over it).
 */
export const test = base.extend<{ user: UserSteps; client: ApiClient; api: ApiSteps }>({
  // The second argument gives the fixture to the test; it is named `provide` since a call named
  // `use` reads as a React hook.
  user: async ({ page }, provide) => {
    await provide(userOf(page))
  },
  client: async ({ request }, provide) => {
    await provide(apiClientOf(request, frontendUrl))
  },
  api: async ({ client }, provide) => {
    await provide(apiOf(client))
  },
})
