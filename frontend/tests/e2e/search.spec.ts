import { expect, test } from '@playwright/test'

import { PROJECT_IDS } from '../../src/mocks/mock-ids.constants'

const search = `/projects/${PROJECT_IDS.mentor}/search`

test('searches the items and opens one in Artifacts', async ({ page }) => {
  await page.goto(search)

  await page.getByRole('searchbox', { name: 'Search items' }).fill('REQ-001')
  await page.getByRole('link', { name: /REQ-001/ }).click()

  await expect(page).toHaveURL(/\/artifacts\/items\//, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: /Search mentors/ })).toBeVisible()
  await expect(page.getByText('The system shall let a student search mentors')).toBeVisible()
  const tabs = page.getByRole('navigation', { name: 'Open editors' })
  await expect(tabs.getByRole('link', { name: 'REQ-001' })).toBeVisible()
})
