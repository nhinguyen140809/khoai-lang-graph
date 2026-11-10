import { request } from '@playwright/test'

import { frontendUrl, seededAccount, storageStatePath } from './backend-env.constants'

/**
 * Signs in once as the seeded account and keeps the cookies, which every test starts with: the
 * login is limited per address, so a test that signed in itself would soon be refused.
 */
export default async function globalSetup() {
  const context = await request.newContext({
    baseURL: frontendUrl,
    extraHTTPHeaders: { Origin: frontendUrl },
  })
  const response = await context.post('/api/v1/auth/login', { data: seededAccount })
  if (!response.ok()) {
    throw new Error(`The seeded account could not sign in: ${String(response.status())}`)
  }
  await context.storageState({ path: storageStatePath })
  await context.dispose()
}
